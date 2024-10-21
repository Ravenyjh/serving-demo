import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const zgTestnet = {
  blockExplorers: {
    default: {
      name: "0G Testnet",
      url: "https://0g-json-rpc-public.originstake.com",
      apiUrl: "",
    },
  },
  id: 16600,
  name: "0g Chain Testnet",
  nativeCurrency: {
    name: "A0GI",
    symbol: "A0GI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://0g-json-rpc-public.originstake.com"],
      ws: [""],
    },
  },
};

// const zgTestnet = {
//   blockExplorers: {
//     default: {
//       name: "Local Testnet",
//       url: "http://localhost:8545",
//       apiUrl: "",
//     },
//   },
//   id: 31337,
//   name: "0g Chain Testnet",
//   nativeCurrency: {
//     name: "A0GI",
//     symbol: "A0GI",
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: {
//       http: ["http://localhost:8545"],
//       ws: [""],
//     },
//   },
// };

export function getConfig() {
  return createConfig({
    chains: [zgTestnet],
    connectors: [
      injected(),
      coinbaseWallet(),
      walletConnect({ projectId: "e05813981047e338e52f669d17150b3c" }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [zgTestnet.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
