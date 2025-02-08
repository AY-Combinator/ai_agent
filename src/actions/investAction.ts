import { type ByteArray, parseUnits, type Hex, encodeFunctionData } from "viem";
import {
    type Action,
    composeContext,
    generateObjectDeprecated,
    type HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";

import { investTemplate } from "../templates/investTemplate.ts";
import {initWalletProvider, SupportedChain, WalletProvider} from "@elizaos/plugin-evm";
const USDC_CONTRACT = "0xA7c9B5c961B9D7bfa3588Bc3b29a609806093A3f";
const INVEST_CONTRACT = "0x16Fb8E786347B6Ab1f6114BacbAfb6Ed7970C754";

// Add USDC approval ABI
const USDC_ABI = [{
    inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
}];

const INVEST_ABI = [{
    inputs: [
      { internalType: "address", name: "beneficiary", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "invest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
}];

export class InvestAction {
    constructor(private walletProvider: WalletProvider) {}

    async invest(params: { 
        beneficiary: string; 
        amount: string; 
        fromChain: "baseSepolia" | string  // or the specific chain type from your config
    }): Promise<{ hash: string }> {
        console.log(
            `Investing: ${params.amount} USDC for beneficiary ${params.beneficiary} on ${params.fromChain}`
        );

        console.log('Investing------params', params)
        this.walletProvider.switchChain(params.fromChain as SupportedChain);
        const walletClient = this.walletProvider.getWalletClient(params.fromChain as SupportedChain);

        console.log('Investing------')
        try {
            // // First approve USDC spending
            // const approveData = encodeFunctionData({
            //     abi: USDC_ABI,
            //     functionName: 'approve',
            //     args: [INVEST_CONTRACT, parseUnits(params.amount, 6)]
            // });
            //
            // await walletClient.sendTransaction({
            //     account: walletClient.account,
            //     to: USDC_CONTRACT,
            //     data: approveData as Hex,
            //     chain: undefined,
            //     kzg: undefined
            // });

            // Then execute investment
            const investData = encodeFunctionData({
                abi: INVEST_ABI,
                functionName: 'invest',
                args: [params.beneficiary, parseUnits(params.amount, 1)]
            });

            const hash = await walletClient.sendTransaction({
                account: walletClient.account,
                to: INVEST_CONTRACT,
                data: investData as Hex,
                chain: undefined,
                kzg: undefined
            });

            return { hash };
        } catch (error) {
            console.log('Error investing------',error)
            throw new Error(`Investment failed: ${error.message}`);
        }
    }
}

const buildInvestDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: WalletProvider
) => {
    const chains = Object.keys(wp.chains);
    state.supportedChains = chains.map((item) => `"${item}"`).join("|");

    const context = composeContext({
        state,
        template: investTemplate,
    });

    const investDetails = await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    });

    const existingChain = wp.chains[investDetails.fromChain];
    if (!existingChain) {
        throw new Error(
            `Chain ${investDetails.fromChain} not configured. Available chains: ${chains.toString()}`
        );
    }

    return investDetails;
};

export const investAction: Action = {
    name: "INVEST",
    description: "Invest funds through the investment contract",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        console.log("Invest action handler called 1");
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        console.log("Invest action handler called");
        const walletProvider = await initWalletProvider(runtime);
        const action = new InvestAction(walletProvider);

        const paramOptions = await buildInvestDetails(state, runtime, walletProvider);

        try {
            const investResp = await action.invest(paramOptions);
            if (callback) {
                callback({
                    text: `Successfully invested ${paramOptions.amount} for ${paramOptions.beneficiary}\nTransaction Hash: ${investResp.hash}`,
                    content: {
                        success: true,
                        hash: investResp.hash,
                        amount: paramOptions.amount,
                        beneficiary: paramOptions.beneficiary,
                        chain: paramOptions.fromChain,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error during investment:", error);
            if (callback) {
                callback({
                    text: `Error investing: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        console.log("validating investAction handler called");
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "Confirming immediate investment. 100 USDC for beneficiary 0x5e041D2e576CCF158bb04f8CB4b6948D1CA4B782 on Base Sepolia testnet.",
                    action: "INVEST",
                    amount: "100",
                    beneficiary: "0x5e041D2e576CCF158bb04f8CB4b6948D1CA4B782",
                    fromChain: "baseSepolia"
                }
            },
            {
                user: "user",
                content: {
                    text: "Invest 100 USDC for beneficiary 0x5e041D2e576CCF158bb04f8CB4b6948D1CA4B782"
                }
            }
        ]
    ],
    similes: ["INVEST_FUNDS", "MAKE_INVESTMENT", "FUND_PROJECT", "INVEST_IN_PROJECT"],
}; 