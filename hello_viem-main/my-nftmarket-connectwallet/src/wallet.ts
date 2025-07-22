const projectId = 'your-walletconnect-project-id'; // ✅ 放前面

const metadata = {
  name: 'NFTMarket',
  description: 'My Awesome NFT Marketplace',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: connectors({
    projectId,
    metadata,
  }),
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
