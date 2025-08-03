import React from 'react';
import ReactDOM from 'react-dom/client';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import App from './App.tsx';

// 导入 React Query 的配置
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建 QueryClient 实例
const queryClient = new QueryClient();

// 1. 获取你的 WalletConnect Cloud 项目 ID
const projectId = '9e89f357e64d75878959985f90dc0e6a';

// 2. 配置 chains
const chains = [mainnet, sepolia];

// 3. 创建 Wagmi config
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata: {
    name: 'My NFT App',
    description: 'A simple NFT marketplace',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
});

// 4. 创建 Web3Modal
createWeb3Modal({ wagmiConfig, projectId, chains });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 用 QueryClientProvider 包裹整个应用 */}
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);