import { Action, Memory } from "@elizaos/core";

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
        const settings = context.character.settings as any;
        const currentSection = settings.moduleProgress.currentSection;
        const currentQuestionIndex = settings.moduleProgress.currentQuestionIndex;
        const questions = settings.problemFramingModule[currentSection].questions;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;

        const params = {
            section: currentSection,
            questionIndex: isLastQuestion ? currentQuestionIndex : currentQuestionIndex + 1,
            isComplete: isLastQuestion,
            callbackUrl: isLastQuestion ? "http://localhost:3003" : undefined
        };

        (context.character.settings as unknown as ExtendedSettings).moduleProgress = {
            ...(context.character.settings as unknown as ExtendedSettings).moduleProgress,
            currentSection: params.section,
            currentQuestionIndex: params.questionIndex,
            completedSections: params.isComplete 
                ? [...(context.character.settings as unknown as ExtendedSettings).moduleProgress.completedSections, params.section]
                : (context.character.settings as unknown as ExtendedSettings).moduleProgress.completedSections
        };

        if (params.isComplete && params.callbackUrl) {
            try {
                await fetch(params.callbackUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        section: params.section,
                        completedAt: new Date().toISOString(),
                        userId: context.character.id
                    })
                });
            } catch (error) {
                console.error('Failed to notify completion:', error);
            }
        }

        return { 
            success: true,
            sectionComplete: params.isComplete,
            nextSection: params.isComplete ? getNextSection(params.section) : null
        };
    }
};

function getNextSection(currentSection: string): string | null {
    const sections = ['problemStatement', 'contextBackground', 'stakeholders', 'rootCause', 
                     'problemScope', 'assumptions', 'userInsights', 'framingStatement', 'validation'];
    const currentIndex = sections.indexOf(currentSection);
    return currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
} 