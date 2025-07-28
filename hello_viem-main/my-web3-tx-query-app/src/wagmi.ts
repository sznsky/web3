import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, bscTestnet, goerli, polygonAmoy } from 'wagmi/chains' // 根据你实际使用的链选择导入

export const config = createConfig({
  chains: [mainnet, sepolia, bscTestnet, goerli, polygonAmoy], // 这里列出你的应用支持的链
  transports: {
    // 为每个链配置传输协议，你可以使用公共 RPC 或自己的 Alchemy/Infura URL
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bscTestnet.id]: http(), // 示例：币安智能链测试网
    [goerli.id]: http(),
    [polygonAmoy.id]: http(), // Polygon Amoy，根据需要添加
  },
})