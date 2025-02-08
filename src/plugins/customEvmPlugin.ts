import { evmPlugin } from "@elizaos/plugin-evm";
import { Plugin, Action, Provider } from "@elizaos/core";
import { investAction } from "../actions/investAction.ts";

// Custom transfer action
const transferAction: Action = {
  name: "transfer",
  description: "Transfer ETH or tokens on EVM chains",
  similes: ["send eth", "send tokens", "transfer funds"],
  examples: [[
    {
      user: "user",
      content: {
        text: "Transfer 0.01 ETH to 0x5e041D2e576CCF158bb04f8CB4b6948D1CA4B782",
        action: "transfer",
        amount: "0.01",
        to: "0x5e041D2e576CCF158bb04f8CB4b6948D1CA4B782"
      }
    }
  ]],
  validate: async (context, message) => {
    return !!(message?.content?.amount && message?.content?.to);
  },
  handler: async (context, message) => {
    const provider = context.providers[0]; // Get first provider
    if (!provider) throw new Error("EVM wallet provider not found");
    
    return await provider.get(context, message);
  }
};

// EVM Wallet Provider
const evmWalletProvider: Provider = {
  get: async (runtime, message) => {
    // Handle wallet operations
    if (message.content.action === "transfer") {
      // Transfer logic here
      return {
        success: true,
        amount: message.content.amount,
        recipient: message.content.to,
        chain: "base-sepolia"
      };
    }
    return null;
  }
};
export const customEvmPlugin: Plugin = {
  name: "customEvmPlugin",
  description: "Extended EVM plugin with transfer and investment capabilities",
  actions: [...(evmPlugin.actions || []), transferAction, investAction],
  providers: [...(evmPlugin.providers || []), evmWalletProvider],
  evaluators: [...(evmPlugin.evaluators || [])],
  services: [...(evmPlugin.services || [])],
  clients: [...(evmPlugin.clients || [])]
};