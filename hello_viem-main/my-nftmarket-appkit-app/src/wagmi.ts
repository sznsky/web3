
// src/wagmi.ts
import { sepolia } from 'wagmi/chains'
import { defaultWagmiConfig } from '@web3modal/wagmi/react'
import { createWeb3Modal } from '@web3modal/wagmi/react'

// ✅ 你的 WalletConnect 项目 ID
export const projectId = '8d520d9b0ff0f09022278b18d5f66167'

// ✅ DApp 信息元数据（显示在钱包弹窗中）
const metadata = {
  name: 'NFT Market',
  description: 'Simple NFT Market App',
  url: 'http://localhost:5173', // ✅ 一定是你项目的访问地址，不是 RPC
  icons: ['https://walletconnect.com/walletconnect-logo.png'], // ✅ 用个真实图标地址
}

// ✅ 支持的链
const chains = [sepolia]

// ✅ 配置 wagmi
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

// ✅ 初始化 Web3Modal（必须调用一次）
createWeb3Modal({ wagmiConfig, projectId, chains })
