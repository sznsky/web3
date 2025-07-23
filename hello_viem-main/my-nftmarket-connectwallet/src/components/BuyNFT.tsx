import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import NFTMarketAbi from "../abis/NFTMarket.json";
import { parseUnits, type Address } from "viem";

const marketAddress: Address = "0xYourMarketContractAddress"; // 替换为你的市场合约地址

export default function BuyNFT() {
  const { address } = useAccount();
  const [nftAddress, setNftAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("0.01");

  const { data: buyHash, writeContract: buyWriteContract, isPending: isBuying, error: buyError } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuyConfirmed } = useWaitForTransactionReceipt({ hash: buyHash });

  const handleBuy = () => {
    if (!address || !nftAddress || !tokenId || !price) return;
    buyWriteContract({
      address: marketAddress,
      abi: NFTMarketAbi,
      functionName: "buyItem",
      args: [nftAddress as Address, BigInt(tokenId)],
      value: parseUnits(price, 18), // 如果需要支付ETH，或根据合约实际参数调整
    });
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, margin: "16px 0" }}>
      <h2>购买 NFT</h2>
      <input
        placeholder="NFT 合约地址"
        value={nftAddress}
        onChange={(e) => setNftAddress(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        placeholder="价格 (TOKEN)"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button onClick={handleBuy} disabled={isBuying || isBuyConfirming} style={{ width: "100%" }}>
        {isBuying ? "等待钱包确认..." : isBuyConfirming ? "购买中..." : "购买 NFT"}
      </button>
      {isBuyConfirmed && <div style={{ color: "green", marginTop: 10 }}>NFT 购买成功! Tx: {buyHash}</div>}
      {buyError && <div style={{ color: "red", marginTop: 10 }}>购买失败: {buyError.message}</div>}
    </div>
  );
}