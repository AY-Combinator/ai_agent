# AY Combinator AI Agents with Secure Data Storage

A collection of specialized AI experts powered by Anthropic's Claude, helping startups develop comprehensive strategies with secure data storage via Nillion.

## AI Expert Agents

Each agent guides you through structured modules, storing responses securely:

### Strategy Development
- **Problem Framing Expert**: Core problem definition and analysis
- **Market Research Expert**: Market validation and industry analysis
- **Brand Positioning Expert**: Brand strategy and market differentiation
- **Sales Strategy Expert**: B2B/B2C sales methodologies

### Risk & Investment
- **Investment Readiness Expert**: Fundraising preparation and investor relations
- **Risk Analyst**: Risk analysis and hypothesis testing
- **Risk Reevaluation Expert**: Risk assessment and mitigation strategies
- **Exit Strategy Expert**: Exit planning and M&A preparation

### Growth & Community
- **Scaling Strategies Expert**: Growth and expansion planning
- **Community Building Expert**: Community engagement and development

Each expert:
- Follows structured question modules
- Provides real-time feedback
- Stores encrypted responses using Nillion
- Generates actionable summaries

## Secure Data Storage

All module responses are encrypted and distributed across Nillion's secure network:
- Responses encrypted using $share mechanism
- Data distributed across multiple nodes
- Maintains confidentiality of strategic information

## Investment Capabilities

The Investor agent is powered by Coinbase Agent Kit for secure on-chain interactions:
- Executes investments through smart contracts on Base Sepolia testnet
- Processes USDC investments with automated approvals
- Validates investment criteria and scoring thresholds
- Performs thorough due diligence through structured evaluation

Investment workflow:
1. Reviews project scores and problem framing analysis
2. Evaluates opportunities against defined investment criteria
3. Makes decisions within portfolio constraints
4. Executes investments through Base Sepolia contracts
5. Stores investment records securely via Nillion

## Getting Started

To run the project locally:

```bash
pnpm start
```

This will:
- Start all AI expert agents
- Initialize secure data storage
- Connect to Base Sepolia testnet
- Enable CLI interaction with agents

The investor agent configuration and smart contract interactions can be found in:
```typescript:src/characters/investorCharacter.ts
startLine: 26
endLine: 63
```

And the investment action implementation is in:
```typescript:src/actions/investAction.ts
startLine: 41
endLine: 95
```

