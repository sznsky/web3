// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WagmiProvider } from "wagmi"; // 导入 WagmiProvider
import { AppKitProvider } from "@reown/appkit/react";
import { wagmiConfig } from "./wallet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 新增导入

// 新增 QueryClient 实例
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* WagmiProvider 替代了旧的 WagmiConfig */}
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* AppKitProvider 现在需要接收 wagmiConfig */}
        <AppKitProvider config={wagmiConfig}>
          <App />
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);


