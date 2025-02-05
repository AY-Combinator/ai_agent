import { Action, Memory } from "@elizaos/core";

export const scoreAnswer: Action = {
    name: "scoreAnswer",
    description: "Score user answers based on problem framing criteria",
    similes: ["evaluate response", "grade answer", "assess submission", "rate solution"],
    examples: [
        [
            {
                user: "founder",
                content: {
                    text: "Our problem is that small businesses waste 5-10 hours per week on manual bookkeeping tasks, leading to reduced productivity and increased error rates. This affects primarily businesses with 1-50 employees across retail and service industries. Market research shows this costs them an average of $500/month in lost productivity.",
                    action: "scoreAnswer",
                    section: "problemStatement"
                }
            }
        ],
        [
            {
                user: "founder",
                content: {
                    text: "Based on interviews with 50 small business owners and analysis of their accounting workflows, we found that 87% are using spreadsheets and paper receipts for bookkeeping. Industry reports show this manual approach leads to a 23% error rate in financial reporting.",
                    action: "scoreAnswer",
                    section: "validationEvidence"
                }
            }
        ]
    ],
    validate: async (context, message) => {
        const settings = context.character.settings as any;
        return !!(settings?.scoringCriteria && message?.content?.text);
    },
    handler: async (context, message: Memory) => {
        const settings = context.character.settings as any;
        const criteria = settings.scoringCriteria;
        const answer = message.content.text;
        const section = (message.content.section || 'problemStatement') as keyof typeof criteria;
        
        const score = calculateSectionScore(answer, criteria[section]);
        const feedback = generateFeedback(score, criteria[section]);

        // Send score to external API
        try {
            await fetch('http://localhost:3003/judge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: context.character.id,
                    section: section,
                    score: score,
                    feedback: feedback,
                    answer: answer,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send score to external API:', error);
        }
        
        return {
            success: true,
            score,
            feedback
        };
    }
};

function calculateSectionScore(answer: string, criteria: any) {
    // Implement scoring logic based on criteria
    let score = 0;
    
    // Example scoring logic for problem statement
    if (answer.includes("clearly defined problem")) score += 2;
    if (answer.includes("stakeholders")) score += 2;
    if (answer.includes("impact")) score += 2;
    if (answer.includes("data") || answer.includes("evidence")) score += 2;
    if (!answer.includes("solution")) score += 2; // Avoiding solution prescription
    
    return Math.min(score, 10); // Cap at max score
}

function generateFeedback(score: number, criteria: any) {
    // Generate detailed feedback based on score and criteria
    let feedback = "";
    
    if (score <= 3) {
        feedback = "The problem statement needs significant improvement. Focus on clearly defining the problem and its impact.";
    } else if (score <= 6) {
        feedback = "The problem statement shows potential but needs more specificity and stakeholder consideration.";
    } else {
        feedback = "Strong problem statement with clear definition and stakeholder impact.";
    }
    
    return feedback;
} 