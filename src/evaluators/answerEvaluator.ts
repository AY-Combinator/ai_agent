import { Evaluator, Memory } from "@elizaos/core";

export const answerEvaluator: Evaluator = {
    name: "answerEvaluator",
    description: "Evaluates user answers for module progress",
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
    validate: async (context, message) => {
        // Check if we're in a module progress context
        const settings = context.character.settings as any;
        console.log(!!(settings?.moduleProgress &&
            settings?.problemFramingModule &&
            message?.content?.text))
        return !!(settings?.moduleProgress && 
                settings?.problemFramingModule && 
                message?.content?.text);
    },
    handler: async (context, message: Memory) => {
        console.log('Answer Evaluator triggered:', {
            messageContent: message.content
        });
        const action = context.actions.find(a => a.name === "trackModuleProgress");
        await action.handler(context, message);
        return { score: 0.8 };
    }
}; 