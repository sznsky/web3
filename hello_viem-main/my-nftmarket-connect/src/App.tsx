import React, { useState } from "react";
import { createWalletClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import EthereumProvider from "@walletconnect/ethereum-provider";

// TODO: 替换为你的 NFTMarket 合约地址和 ABI
const NFTMARKET_ADDRESS = "0xYourNFTMarketAddress";
const NFTMARKET_ABI = [
  // ...你的合约 ABI...
];

export default function App() {
  const [address, setAddress] = useState<string>("");
  const [provider, setProvider] = useState<any>(null);
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [nfts] = useState([
    { tokenId: "1", owner: "0x111...", price: "0.01" },
    { tokenId: "2", owner: "0x222...", price: "0.02" },
  ]);
  const [loading, setLoading] = useState(false);

  // 钱包连接
  const connectWallet = async () => {
    const ethProvider = await EthereumProvider.init({
      projectId: "8d520d9b0ff0f09022278b18d5f66167", // https://cloud.walletconnect.com 注册获取
      chains: [1], // mainnet
      showQrModal: true,
    });
    await ethProvider.enable();
    setProvider(ethProvider);
    setAddress(ethProvider.accounts[0]);
  };

  // 上架 NFT
  const listNFT = async () => {
    if (!provider || !address) return;
    setLoading(true);
    try {
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: mainnet,
        transport: http(), // 这里可用 custom(provider) 但需适配
      });
      await walletClient.writeContract({
        address: NFTMARKET_ADDRESS,
        abi: NFTMARKET_ABI,
        functionName: "listNFT",
        args: [tokenId, parseEther(price)],
      });
      alert("上架成功！");
    } catch (e) {
      alert("上架失败: " + (e as any).message);
    }
    setLoading(false);
  };

  // 购买 NFT
  const buyNFT = async (tokenId: string, price: string) => {
    if (!provider || !address) return;
    setLoading(true);
    try {
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: mainnet,
        transport: http(),
      });
      await walletClient.writeContract({
        address: NFTMARKET_ADDRESS,
        abi: NFTMARKET_ABI,
        functionName: "buyNFT",
        args: [tokenId],
        value: parseEther(price),
      });
      alert("购买成功！");
    } catch (e) {
      alert("购买失败: " + (e as any).message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h2>NFTMarket 前端 Demo</h2>
      <button onClick={connectWallet} disabled={!!address}>
        {address ? `已连接: ${address.slice(0, 6)}...${address.slice(-4)}` : "连接钱包"}
      </button>
      <hr />
      <h3>上架 NFT</h3>
      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={e => setTokenId(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <input
        placeholder="价格 (ETH)"
        value={price}
        onChange={e => setPrice(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={listNFT} disabled={!address || !tokenId || !price || loading}>
        {loading ? "上架中..." : "上架"}
      </button>
      <hr />
      <h3>NFT 列表</h3>
      <ul>
        {nfts.map(nft => (
          <li key={nft.tokenId} style={{ marginBottom: 12 }}>
            TokenID: {nft.tokenId} | Owner: {nft.owner} | 价格: {nft.price} ETH
            <button
              style={{ marginLeft: 12 }}
              onClick={() => buyNFT(nft.tokenId, nft.price)}
              disabled={!address || nft.owner === address || loading}
            >
              {loading ? "处理中..." : "购买"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}