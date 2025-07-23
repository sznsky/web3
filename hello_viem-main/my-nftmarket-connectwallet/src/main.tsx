import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { walletConnectProvider } from "@wagmi/core/providers/walletConnect";

// 你需要在 WalletConnect 官网申请一个 projectId
const projectId = "你的WalletConnect项目ID";

const { chains, publicClient } = configureChains(
  [mainnet],
  [
    walletConnectProvider({ projectId }),
    publicProvider(),
  ]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  chains,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App />
    </WagmiConfig>
  </React.StrictMode>
);