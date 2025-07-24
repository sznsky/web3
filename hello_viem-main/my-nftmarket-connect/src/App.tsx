import React, { useState } from "react";
import { createWalletClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import EthereumProvider from "@walletconnect/ethereum-provider";
import NFTMARKET_ABI_JSON from "./abis/NFTMarket.json";
//import MYERC721_ABI_JSON from "./abis/MyERC721.json"; // 假设你有一个 NFTMarket.json 文件包含 ABI
//import MYERC20_ABI_JSON from "./abis/MyERC20.json"; 

// TODO: 替换为你的 NFTMarket 合约地址和 ABI
const NFTMARKET_ADDRESS = "0x7f8770B0923a52f35168C66A5d65e8AF4bf2D44B";
const NFTMARKET_ABI = NFTMARKET_ABI_JSON.abi;

//const MYERC20_ABI = MYERC20_ABI_JSON.abi;
const MYERC721_ADDRESS = "0x633b4368f731f01abce050B6d7272e4f1E19Fba9";
//const MYERC721_ABI = MYERC721_ABI_JSON.abi;

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
        functionName: "list",
        args: [MYERC721_ADDRESS,tokenId, parseEther(price)],
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