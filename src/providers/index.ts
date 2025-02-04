import { Plugin } from "@elizaos/core";
import { trackModuleProgress } from "../actions/moduleProgress.ts";
import { answerEvaluator } from "../evaluators/answerEvaluator.ts";

export const moduleProvider: Plugin = {
    name: "moduleProvider",
    description: "Provides module progress tracking functionality",
    actions: [trackModuleProgress],
    evaluators: [answerEvaluator],
    clients: []
}; 