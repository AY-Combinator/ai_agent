import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import { solanaPlugin } from "@elizaos/plugin-solana";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.ts";
import { character } from "./character.ts";
import { startChat } from "./chat/index.ts";
import { initializeClients } from "./clients/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import {judgeCharacter} from "./characters/judgeCharacter.ts";
import {investorCharacter} from "./characters/investorCharacter.ts";
import {mentorCharacter} from "./characters/mentorCharacter.ts";
import {riskAnalystCharacter} from "./characters/riskAnalyst.ts";
import {competitorAnalystCharacter} from "./characters/competitorAnalyst.ts";
import {marketResearchAnalystCharacter} from "./characters/marketResearchAnalyst.ts";
import {userInterviewerCharacter} from "./characters/userInterviewer.ts";
import {userJourneyAnalystCharacter} from "./characters/userJourneyAnalyst.ts";
import {userPersonaAnalystCharacter} from "./characters/userPersonaAnalyst.ts";
import {businessModelAnalystCharacter} from "./characters/businessModelAnalyst.ts";
import {investmentReadinessAnalystCharacter} from "./characters/investmentReadinessAnalyst.ts";
import {exitStrategyAnalystCharacter} from "./characters/exitStrategyAnalyst.ts";
import {scalingStrategiesAnalystCharacter} from "./characters/scalingStrategiesAnalyst.ts";
import {pitchPreparationAnalystCharacter} from "./characters/pitchPreparationAnalyst.ts";
import {teamStrategyAnalystCharacter} from "./characters/teamStrategyAnalyst.ts";
import {measuringImpactAnalystCharacter} from "./characters/measuringImpactAnalyst.ts";
import {salesStrategyAnalystCharacter} from "./characters/salesStrategyAnalyst.ts";
import {contentStrategyAnalystCharacter} from "./characters/contentStrategyAnalyst.ts";
import {communityBuildingAnalystCharacter} from "./characters/communityBuildingAnalyst.ts";
import {gtmStrategyAnalystCharacter} from "./characters/gtmStrategyAnalyst.ts";
import {brandPositioningAnalystCharacter} from "./characters/brandPositioningAnalyst.ts";
import {roadmapAnalystCharacter} from "./characters/roadmapAnalyst.ts";
import {uxAnalystCharacter} from "./characters/uxAnalyst.ts";
import {riskReevaluationAnalystCharacter} from "./characters/riskReevaluationAnalyst.ts";
import {softwareArchitectCharacter} from "./characters/softwareArchitect.ts";
import {mvpDevelopmentAnalystCharacter} from "./characters/mvpDevelopmentAnalyst.ts";
import {jobsToBeAnalystCharacter} from "./characters/jobsToBeAnalyst.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

let nodePlugin: any | undefined;

export function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string
) {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name,
  );

  nodePlugin ??= createNodePlugin();

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: character.plugins?.flatMap(p => p.evaluators || []) || [],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    ].filter(Boolean),
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

async function startAgent(character: Character, directClient: DirectClient) {
  try {
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(character.modelProvider, character);
    const dataDir = path.join(__dirname, "../data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token);

    await runtime.initialize();

    runtime.clients = await initializeClients(character, runtime);

    directClient.registerAgent(runtime);

    // report to console
    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error,
    );
    console.error(error);
    throw error;
  }
}

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

const startAgents = async () => {
  const directClient = new DirectClient();
  let serverPort = parseInt(settings.SERVER_PORT || "3000");
  const args = parseArguments();

  let charactersArg = args.characters || args.character;
  let characters = [character, mentorCharacter, judgeCharacter, investorCharacter, riskAnalystCharacter,
    competitorAnalystCharacter, marketResearchAnalystCharacter, userInterviewerCharacter, userJourneyAnalystCharacter, userPersonaAnalystCharacter, businessModelAnalystCharacter, investmentReadinessAnalystCharacter, exitStrategyAnalystCharacter, scalingStrategiesAnalystCharacter, pitchPreparationAnalystCharacter, teamStrategyAnalystCharacter, measuringImpactAnalystCharacter, salesStrategyAnalystCharacter, contentStrategyAnalystCharacter, communityBuildingAnalystCharacter, gtmStrategyAnalystCharacter, brandPositioningAnalystCharacter, roadmapAnalystCharacter, uxAnalystCharacter, riskReevaluationAnalystCharacter, softwareArchitectCharacter, mvpDevelopmentAnalystCharacter, businessModelAnalystCharacter, competitorAnalystCharacter, marketResearchAnalystCharacter, userJourneyAnalystCharacter, userInterviewerCharacter, jobsToBeAnalystCharacter ];

  console.log("charactersArg", charactersArg);
  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
  }
  console.log("characters", characters);
  try {
    for (const character of characters) {
      await startAgent(character, directClient as DirectClient);
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }

  while (!(await checkPortAvailable(serverPort))) {
    elizaLogger.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
    serverPort++;
  }

  // upload some agent functionality into directClient
  directClient.startAgent = async (character: Character) => {
    // wrap it so we don't have to inject directClient later
    return startAgent(character, directClient);
  };

  directClient.start(serverPort);

  if (serverPort !== parseInt(settings.SERVER_PORT || "3000")) {
    elizaLogger.log(`Server started on alternate port ${serverPort}`);
  }

  const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  if(!isDaemonProcess) {
    elizaLogger.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  }
};

startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});
