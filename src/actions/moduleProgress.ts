import { Action, Memory } from "@elizaos/core";
import { SecretVaultWrapper } from 'nillion-sv-wrappers';
import { v4 as uuidv4 } from 'uuid';
import { orgConfig } from '../nillion/nillionOrgConfig.js';

interface ExtendedSettings {
    moduleProgress: {
        currentSection: string;
        currentQuestionIndex: number;
        completedSections: string[];
        [key: string]: any; // For dynamic section answers
    };
    [key: string]: any; // This allows for any module type (problemFramingModule, teamStrategyModule, etc.)
}

const SCHEMA_ID = 'ac706abf-e7f1-47bc-bef5-cf21f9d9ce31'; // Use the ID from your schema creation

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
        const settings = context.character.settings as unknown as ExtendedSettings;
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
        console.log('params', params);

        settings.moduleProgress = {
            ...settings.moduleProgress,
            currentSection: params.section,
            currentQuestionIndex: params.questionIndex,
            completedSections: params.isComplete 
                ? [...settings.moduleProgress.completedSections, params.section]
                : settings.moduleProgress.completedSections
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

        console.log(getNextSection(params.section), params);
        // If all sections are complete, generate the template and store in Nillion
        if (params.isComplete && !getNextSection(params.section)) {
            console.log('Generating template and storing in Nillion');
            const template = generateProblemFramingTemplate(context.character.settings);
            
            try {
                const collection = new SecretVaultWrapper(
                    orgConfig.nodes,
                    orgConfig.orgCredentials,
                    SCHEMA_ID
                );
                await collection.init();

                const moduleData = [{
                    _id: uuidv4(),
                    module_type: { $allot: context.character.name.replace(' Expert', '').toLowerCase() },
                    completed_at: { $allot: new Date().toISOString() },
                    sections: settings.moduleProgress.completedSections.map(section => ({
                        section_name: { $allot: section },
                        answers: settings.moduleProgress[section]?.answers.map(answer => ({
                            $allot: answer
                        })) || []
                    }))
                }];

                const dataWritten = await collection.writeToNodes(moduleData);
                console.log('✅ Module data stored in Nillion:', JSON.stringify(dataWritten, null, 2));

            } catch (error) {
                console.error('❌ Failed to store in Nillion:', error.message);
            }

            return { 
                success: true,
                sectionComplete: params.isComplete,
                nextSection: null,
                template
            };
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

function generateProblemFramingTemplate(settings: any): string {
    const answers = collectAnswersFromSections(settings);
    return `
Key Questions for Problem Framing

1. Defining the Problem
- Core Problem: ${answers.problemStatement[0]}
- Affected Parties: ${answers.problemStatement[1]}
- Impact: ${answers.problemStatement[2]}

2. Understanding the Context
- Market/Industry State: ${answers.contextBackground[0]}
- Existing Solutions: ${answers.contextBackground[1]}
- Influencing Trends: ${answers.contextBackground[2]}

3. Stakeholders & Impact
- Key Stakeholders: ${answers.stakeholders[0]}
- Pain Points: ${answers.stakeholders[1]}
- Different Perspectives: ${answers.stakeholders[2]}

4. Root Cause Analysis
- Underlying Causes: ${answers.rootCause[0]}
- Supporting Evidence: ${answers.rootCause[1]}
- Systemic Issues: ${answers.rootCause[2]}

5. Problem Scope & Boundaries
- Addressed Aspects: ${answers.problemScope[0]}
- Out of Scope: ${answers.problemScope[1]}
- Success Definition: ${answers.problemScope[2]}

6. Assumptions & Constraints
- Key Assumptions: ${answers.assumptions[0]}
- Constraints: ${answers.assumptions[1]}
- Impact of Limitations: ${answers.assumptions[2]}

7. User & Customer Insights
- User Feedback: ${answers.userInsights[0]}
- Research Support: ${answers.userInsights[1]}
- Behavioral Patterns: ${answers.userInsights[2]}

8. Problem Statement Clarity
- Clear Statement: ${answers.framingStatement[0]}
- Stakeholder Needs: ${answers.framingStatement[1]}
- Solution Space: ${answers.framingStatement[2]}

9. Validation & Evidence
- Problem Significance: ${answers.validation[0]}
- Urgency Metrics: ${answers.validation[1]}
- Non-action Risks: ${answers.validation[2]}
`;
}

function collectAnswersFromSections(settings: any): Record<string, string[]> {
    const moduleProgress = settings.moduleProgress;
    const answers: Record<string, string[]> = {};
    
    Object.keys(settings.problemFramingModule).forEach(section => {
        answers[section] = moduleProgress[section]?.answers || [];
    });
    
    return answers;
} 