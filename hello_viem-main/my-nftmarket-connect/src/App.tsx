import React, { useState, useEffect } from "react";
import {
  createWalletClient,
  http,
  parseEther,
  createPublicClient,
  custom, // 导入 custom transport
} from "viem";
import { mainnet, sepolia } from "viem/chains"; // 确保导入 sepolia
import EthereumProvider from "@walletconnect/ethereum-provider";

import NFTMARKET_ABI_JSON from "./abis/NFTMarket.json";
import MYERC721_ABI_JSON from "./abis/MyERC721.json";

// --- 常量配置 ---
// 根据你的实际部署链进行选择
const ALCHEMY_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/y_oohbF92oDh0B0wjFwl94sa0jXXEbFv"; // 你的 Alchemy RPC URL
const CHAIN = sepolia; // 你提到在 Sepolia 上部署，所以这里用 sepolia
// 或者 const CHAIN = mainnet;

// NFTMarket 合约地址和 ABI
const NFTMARKET_ADDRESS = "0x7f8770B0923a52f35168C66A5d65e8AF4bf2D44B";
const NFTMARKET_ABI = NFTMARKET_ABI_JSON.abi;

// MyERC721 合约地址和 ABI
const MYERC721_ADDRESS = "0x633b4368f731f01abce050B6d7272e4f1E19Fba9";
const MYERC721_ABI = MYERC721_ABI_JSON.abi;

// Viem Public Client，用于读取链上数据
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(ALCHEMY_RPC_URL), // 你的 Alchemy RPC URL
});

export default function App() {
  const [address, setAddress] = useState<string>("");
  const [provider, setProvider] = useState<any>(null);
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [nfts, setNfts] = useState<
    { tokenId: string; seller: string; price: string; isListed: boolean; owner: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- 钱包连接 ---
  const connectWallet = async () => {
    try {
      const ethProvider = await EthereumProvider.init({
        projectId: "8d520d9b0ff0f09022278b18d5f66167",
        chains: [CHAIN.id],
        showQrModal: true,
        rpcMap: {
          [CHAIN.id]: ALCHEMY_RPC_URL, // 使用 Alchemy RPC URL
        },
      });
      await ethProvider.enable();
      setProvider(ethProvider);
      setAddress(ethProvider.accounts[0]);
      fetchNFTs(); // 连接成功后刷新 NFT 列表
    } catch (error) {
      console.error("连接钱包失败:", error);
      alert("连接钱包失败，请检查控制台。");
    }
  };

  // --- 获取链上 NFT 列表 ---
  const fetchNFTs = async () => {
    setRefreshing(true);
    try {
      const tokenIdsToFetch = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]; // 示例：可以扩展更多 ID
      const fetchedNfts = [];

      for (const id of tokenIdsToFetch) {
        let isListed = false;
        let seller = "0x0000000000000000000000000000000000000000"; // 默认零地址
        let listedPrice = BigInt(0);

        try {
            // 1. 查询 NFTMarket 合约的 getListing 函数
            const listing: any = await publicClient.readContract({
              address: NFTMARKET_ADDRESS,
              abi: NFTMARKET_ABI,
              functionName: "getListing",
              args: [MYERC721_ADDRESS, BigInt(id)],
            });
            isListed = listing[0];
            seller = listing[1];
            listedPrice = listing[2];
        } catch (listingError) {
            // 如果 getListing 报错，可能意味着该 NFT 没有上架信息
            console.warn(`Token ID ${id} 没有上架信息或查询失败:`, listingError);
            isListed = false; // 确保isListed为false
        }

        // 2. 查询 MyERC721 合约的 ownerOf 函数来获取当前所有者
        let currentOwner = "0x0000000000000000000000000000000000000000"; // 默认零地址
        try {
          currentOwner = (await publicClient.readContract({
            address: MYERC721_ADDRESS,
            abi: MYERC721_ABI,
            functionName: "ownerOf",
            args: [BigInt(id)],
          })) as string;
        } catch (ownerError) {
          // 如果 NFT 不存在或没有所有者，ownerOf 可能会报错
          // console.warn(`无法获取 Token ID ${id} 的所有者:`, ownerError); // 生产环境可以注释掉过多警告
          currentOwner = "0x0000000000000000000000000000000000000000"; // 设为零地址或特定标记
        }

        // 只有当NFT被上架或者该NFT确实存在且有所有者时才加入列表
        if (isListed || currentOwner !== "0x0000000000000000000000000000000000000000") {
            fetchedNfts.push({
                tokenId: id,
                seller: seller,
                price: listedPrice.toString(), // 存储为字符串，显示时再格式化
                isListed: isListed,
                owner: currentOwner,
            });
        }
      }
      setNfts(fetchedNfts);
    } catch (error) {
      console.error("获取 NFT 列表失败:", error);
      alert("获取 NFT 列表失败，请检查控制台。");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  // --- 上架 NFT ---
  const listNFT = async () => {
    if (!provider || !address) {
      alert("请先连接钱包。");
      return;
    }
    if (!tokenId || !price) {
        alert("请输入 Token ID 和价格。");
        return;
    }
    setLoading(true);
    try {
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: CHAIN,
        transport: custom(provider), // 钱包操作可以继续使用默认的 http()，通常它会通过 WalletConnect 代理 RPC
      });

      // 1. 批准 NFTMarket 合约操作你的 ERC721 NFT
      console.log("正在模拟批准交易...");
      const { request: approveRequest } = await publicClient.simulateContract({
        account: address as `0x${string}`,
        address: MYERC721_ADDRESS,
        abi: MYERC721_ABI,
        functionName: "setApprovalForAll",
        args: [NFTMARKET_ADDRESS, true],
      });
      const approveHash = await walletClient.writeContract(approveRequest);
      console.log("批准交易哈希:", approveHash);
      alert("正在等待批准交易确认...");
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      alert("NFTMarket 合约已获批操作您的 NFT。现在将上架 NFT。");


      // 2. 调用 NFTMarket 的 list 函数上架 NFT
      console.log("正在模拟上架交易...");
      const { request: listRequest } = await publicClient.simulateContract({
        account: address as `0x${string}`,
        address: NFTMARKET_ADDRESS,
        abi: NFTMARKET_ABI,
        functionName: "list",
        args: [MYERC721_ADDRESS, BigInt(tokenId), parseEther(price)],
      });
      const listHash = await walletClient.writeContract(listRequest);
      console.log("上架交易哈希:", listHash);
      alert("正在等待上架交易确认...");
      await publicClient.waitForTransactionReceipt({ hash: listHash });

      alert("上架成功！");
      fetchNFTs(); // 刷新列表
    } catch (e) {
      console.error("上架失败:", e);
      alert("上架失败: " + (e as any).message);
    }
    setLoading(false);
  };

  // --- 购买 NFT ---
  const buyNFT = async (id: string, listedPriceEth: string) => { // 接收 ETH 字符串价格
    if (!provider || !address) {
        alert("请先连接钱包。");
        return;
    }
    setLoading(true);
    try {
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: CHAIN,
        transport: custom(provider),
      });

      console.log("正在模拟购买交易...");
      const { request: buyRequest } = await publicClient.simulateContract({
        account: address as `0x${string}`,
        address: NFTMARKET_ADDRESS,
        abi: NFTMARKET_ABI,
        functionName: "buyNFT",
        args: [MYERC721_ADDRESS, BigInt(id)],
        value: parseEther(listedPriceEth), // 将 ETH 字符串转换为 Wei
      });

      const buyHash = await walletClient.writeContract(buyRequest);
      console.log("购买交易哈希:", buyHash);
      alert("正在等待购买交易确认...");
      await publicClient.waitForTransactionReceipt({ hash: buyHash });

      alert("购买成功！");
      fetchNFTs(); // 刷新列表
    } catch (e) {
      console.error("购买失败:", e);
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
        onChange={(e) => setTokenId(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <input
        placeholder="价格 (ETH)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={listNFT} disabled={!address || !tokenId || !price || loading}>
        {loading ? "上架中..." : "上架"}
      </button>
      <hr />
      <h3>NFT 列表 {refreshing && "(刷新中...)"}</h3>
      <button onClick={fetchNFTs} disabled={refreshing}>刷新列表</button>
      <ul>
        {nfts.length === 0 && !refreshing && <p>目前没有上架的 NFT。</p>}
        {nfts.map((nft) => (
          <li key={nft.tokenId} style={{ marginBottom: 12 }}>
            TokenID: {nft.tokenId} | 卖家: {nft.seller === "0x0000000000000000000000000000000000000000" ? "N/A" : `${nft.seller.slice(0, 6)}...${nft.seller.slice(-4)}`} | 价格: {parseFloat(nft.price) / 1e18} ETH | 当前所有者: {nft.owner === "0x0000000000000000000000000000000000000000" ? "N/A" : `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`}
            {" "}
            {nft.isListed ? (
              <button
                style={{ marginLeft: 12 }}
                onClick={() => buyNFT(nft.tokenId, (parseFloat(nft.price) / 1e18).toString())} // 确保这里传递的是 ETH 字符串价格
                disabled={!address || nft.seller.toLowerCase() === address.toLowerCase() || loading}
              >
                {loading ? "处理中..." : "购买"}
              </button>
            ) : (
                <span style={{ marginLeft: 12, color: "gray" }}>未上架</span>
            )}
            {
             !nft.isListed && address && nft.owner.toLowerCase() === address.toLowerCase() && (
                 <span style={{ marginLeft: 12, color: "blue" }}> (您的 NFT)</span>
             )
            }
          </li>
        ))}
      </ul>
    </div>
  );
}
