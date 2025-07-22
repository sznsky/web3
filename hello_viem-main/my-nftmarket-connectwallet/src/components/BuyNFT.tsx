// src/components/BuyNFT.tsx
import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, parseUnits, type Address } from 'viem';
import NFTMarketAbi from '../abis/NFTMarket.json';

const tokenAddress: Address = '0xYourTokenAddress'; // ⚠️ 替换成你的 ERC20 Token 合约地址
const marketAddress: Address = '0xYourMarketContractAddress'; // ⚠️ 替换成你的市场合约地址

interface BuyNFTProps {
    listingId: number;
    price: string;
}

export function BuyNFT({ listingId, price }: BuyNFTProps) {
  const { address } = useAccount();

  // Approve hooks
  const { data: approveHash, writeContract: approve, isPending: isApproving, error: approveError } = useWriteContract();
  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });

  // Purchase hooks
  const { data: purchaseHash, writeContract: purchase, isPending: isPurchasing, error: purchaseError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isPurchaseConfirmed } = useWaitForTransactionReceipt({ hash: purchaseHash });

  // 当 Token 授权成功后，自动执行购买操作
  useEffect(() => {
    if (isApproveConfirmed) {
      console.log('Token approve confirmed, now purchasing...');
      purchase({
        address: marketAddress,
        abi: NFTMarketAbi,
        functionName: 'purchase',
        args: [BigInt(listingId)],
      });
    }
  }, [isApproveConfirmed, purchase, listingId]);


  const handleBuy = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }
    // 1. 发起 Token 授权交易
    approve({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [marketAddress, parseUnits(price, 18)],
    });
  };

  const isWorking = isApproving || isPurchasing || isConfirming;

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
      <h3 className="text-lg font-semibold">购买 NFT</h3>
      <p>ID: {listingId}</p>
      <p>价格: {price} TOKEN</p>
      <button 
        onClick={handleBuy} 
        disabled={isWorking}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
      >
        {isApproving && '等待授权确认...'}
        {isPurchasing && '等待购买确认...'}
        {isConfirming && '交易确认中...'}
        {!isWorking && `购买 NFT #${listingId}`}
      </button>

      {isPurchaseConfirmed && <div style={{color: 'green', marginTop: '10px'}}>购买成功! Tx: {purchaseHash}</div>}
      {(approveError || purchaseError) && <div style={{color: 'red', marginTop: '10px'}}>错误: {approveError?.message || purchaseError?.message}</div>}
    </div>
  );
}