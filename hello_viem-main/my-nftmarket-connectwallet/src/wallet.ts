// src/wallet.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains'; // 推荐在开发中使用测试网，例如 sepolia
import { connectors } from '@reown/appkit';


// 使用 AppKit 的默认配置创建
export const config = getDefaultConfig({
  appName: 'NFTMarket',
  projectId,
  chains: [sepolia], // 使用测试网
  ssr: true,
});

// 1. 从 WalletConnect Cloud 获取你的 Project ID
const projectId = 'your-walletconnect-project-id'; // ⚠️ 替换成你的真实 Project ID

if (!projectId) {
  throw new Error("VITE_WALLETCONNECT_PROJECT_ID is not set");
}

// 2. 定义元数据 (Metadata)，这对于 WalletConnect 是必需的
const metadata = {
  name: 'NFTMarket',
  description: 'My Awesome NFT Marketplace',
  url: 'https://web3modal.com', // 替换成你的网站 URL
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 3. 创建 wagmi 配置
// wagmi v2 不再使用 configureChains 和 publicProvider
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia], // 添加你需要的链，例如主网和Sepolia测试网
  connectors: connectors({
    projectId,
    metadata,
  }),
  // 使用 http transport 来连接到区块链节点
  // 你可以使用公共 RPC，或为了稳定性使用 Alchemy/Infura 等服务的私有 RPC
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // 如果你在 Next.js 等框架中使用，建议开启 SSR
});