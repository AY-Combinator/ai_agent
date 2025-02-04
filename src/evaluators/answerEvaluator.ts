import { Evaluator, Memory } from "@elizaos/core";

export const answerEvaluator: Evaluator = {
    name: "evaluateAnswer",
    description: "Evaluate if the user's answer is complete and satisfactory",
    examples: [
        {
            context: "Evaluating problem statement clarity",
            messages: [
                {
                    user: "founder",
                    content: { 
                        text: "Our problem is that small businesses waste time on manual bookkeeping"
                    }
                }
            ],
            outcome: "Answer is clear but needs more specifics about impact and scale"
        }
    ],
    similes: ["check answer quality", "verify response completeness"],
    handler: async (context, message: Memory) => {
        const answer = message.content.text;
        // Implement your evaluation logic here
        return {
            score: 0.8,
            feedback: "Good answer, but consider adding more specific examples"
        };
    },
    validate: async () => true
}; 