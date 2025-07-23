import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc721Abi, parseUnits, type Address } from "viem";
import NFTMarketAbi from "../abis/NFTMarket.json";

const marketAddress: Address = "0xYourMarketContractAddress"; // 替换为你的市场合约地址

export default function ListNFT() {
  const { address } = useAccount();
  const [nftAddress, setNftAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("0.01");

  // 授权
  const { data: approveHash, writeContract: approveWriteContract } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // 上架
  const { data: listHash, writeContract: listWriteContract, isPending: isListing, error: listError } = useWriteContract();
  const { isLoading: isListConfirming, isSuccess: isListConfirmed } = useWaitForTransactionReceipt({ hash: listHash });

  useEffect(() => {
    if (isApproveSuccess) {
      listWriteContract({
        address: marketAddress,
        abi: NFTMarketAbi,
        functionName: "listItem",
        args: [nftAddress as Address, BigInt(tokenId), parseUnits(price, 18)],
      });
    }
  }, [isApproveSuccess, listWriteContract, nftAddress, tokenId, price]);

  const handleList = () => {
    if (!address || !nftAddress || !tokenId || !price) return;
    approveWriteContract({
      address: nftAddress as Address,
      abi: erc721Abi,
      functionName: "approve",
      args: [marketAddress, BigInt(tokenId)],
    });
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, margin: "16px 0" }}>
      <h2>上架 NFT</h2>
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
      <button onClick={handleList} disabled={isListing || isListConfirming} style={{ width: "100%" }}>
        {isListing ? "等待钱包确认..." : isListConfirming ? "上架中..." : "上架 NFT"}
      </button>
      {isListConfirmed && <div style={{ color: "green", marginTop: 10 }}>NFT 上架成功! Tx: {listHash}</div>}
      {listError && <div style={{ color: "red", marginTop: 10 }}>上架失败: {listError.message}</div>}
    </div>
  );
}