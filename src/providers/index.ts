import { Plugin } from "@elizaos/core";
import { trackModuleProgress } from "../actions/moduleProgress.ts";
import { answerEvaluator } from "../evaluators/answerEvaluator.ts";
import { scoreAnswer } from "../actions/scoreAnswer.ts";
import { evaluateInvestment } from "../actions/evaluateInvestment.ts";

export const moduleProvider: Plugin = {
    name: "moduleProvider",
    description: "Provides module progress tracking functionality",
    actions: [trackModuleProgress],
    evaluators: [answerEvaluator],
    clients: []
};

export const scoreProvider: Plugin = {
    name: "scoreProvider",
    description: "Provides scoring functionality for problem framing evaluation",
    actions: [scoreAnswer],
    evaluators: [],
    clients: []
}; 