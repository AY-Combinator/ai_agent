import { Action, Memory, Content } from "@elizaos/core";

interface ExtendedSettings {
    moduleProgress: {
        currentSection: string;
        currentQuestionIndex: number;
        completedSections: string[];
    };
}

export const trackModuleProgress: Action = {
    name: "trackModuleProgress",
    description: "Track progress through the startup module questions",
    similes: ["track progress", "update status", "move forward"],
    examples: [[
        {
            user: "user",
            content: {
                text: "track module progress",
                action: "trackModuleProgress"
            }
        }
    ]],
    validate: async () => true,
    handler: async (context, message: Memory) => {
        const params = message.content as unknown as {
            section: string;
            questionIndex: number;
            isComplete: boolean;
        };
        
        (context.character.settings as unknown as ExtendedSettings).moduleProgress = {
            ...(context.character.settings as unknown as ExtendedSettings).moduleProgress,
            currentSection: params.section,
            currentQuestionIndex: params.questionIndex,
            completedSections: params.isComplete 
                ? [...(context.character.settings as unknown as ExtendedSettings).moduleProgress.completedSections, params.section]
                : (context.character.settings as unknown as ExtendedSettings).moduleProgress.completedSections
        };
        return { success: true };
    }
}; 