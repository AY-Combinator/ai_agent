import { Action, Memory } from "@elizaos/core";

export const evaluateInvestment: Action = {
    name: "evaluateInvestment",
    description: "Evaluate project for potential investment based on scoring and criteria",
    similes: ["assess investment", "evaluate deal", "analyze opportunity", "review project"],
    examples: [
        [
            {
                user: "founder",
                content: {
                    text: "Project scored 88/100 on problem framing, building ZK infrastructure for Layer2 scaling",
                    action: "evaluateInvestment",
                    score: 88,
                    industry: "ZK",
                    requestedAmount: 30000
                }
            }
        ]
    ],
    validate: async (context, message) => {
        const settings = context.character.settings as any;
        return !!(settings?.investmentCriteria && message?.content?.score);
    },
    handler: async (context, message: Memory) => {
        const settings = context.character.settings as any;
        const criteria = settings.investmentCriteria;
        const score = message.content.score as number;
        const industry = message.content.industry as string;
        const amount = message.content.requestedAmount as number;

        // Evaluate investment opportunity
        const decision = evaluateInvestmentOpportunity(score, industry, amount, criteria);

        // Send investment decision to external API
        try {
            await fetch('http://localhost:3003/investment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: context.character.id,
                    projectId: message.content.projectId,
                    score: score,
                    industry: industry,
                    amount: amount,
                    decision: decision,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to record investment decision:', error);
        }

        return {
            success: true,
            decision,
            rationale: generateInvestmentRationale(decision, score, industry, criteria)
        };
    }
};

function evaluateInvestmentOpportunity(score: number, industry: string, amount: number, criteria: any) {
    if (criteria.excludedIndustries.includes(industry)) {
        return { invest: false, reason: "Industry exclusion" };
    }

    if (!criteria.targetIndustries.includes(industry)) {
        return { invest: false, reason: "Industry not in focus" };
    }

    if (score < criteria.scoreThresholds.minimum) {
        return { invest: false, reason: "Below minimum score threshold" };
    }

    if (amount < criteria.investmentConstraints.minTicket || 
        amount > criteria.investmentConstraints.maxTicket) {
        return { invest: false, reason: "Investment amount out of range" };
    }

    return {
        invest: true,
        amount: amount,
        terms: "SAFE",
        confidence: score >= criteria.scoreThresholds.exceptional ? "High" : "Medium"
    };
}

function generateInvestmentRationale(decision: any, score: number, industry: string, criteria: any) {
    if (!decision.invest) {
        return `Investment declined: ${decision.reason}`;
    }

    return `Investment approved:
    - Score: ${score}/100
    - Industry: ${industry}
    - Amount: $${decision.amount} USDC
    - Terms: ${decision.terms}
    - Confidence: ${decision.confidence}`;
} 