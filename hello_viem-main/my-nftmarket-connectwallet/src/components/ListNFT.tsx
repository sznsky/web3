// src/components/ListNFT.tsx
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc721Abi, parseUnits, type Address } from 'viem';
import NFTMarketAbi from '../abis/NFTMarket.json';

const marketAddress: Address = '0xYourMarketContractAddress'; // ⚠️ 替换成你的市场合约地址

export function ListNFT() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const [nftAddress, setNftAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('0.01'); // 默认价格

  // 等待交易被打包确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleList = async () => {
    if (!address || !nftAddress || !tokenId || !price) {
      alert('请填写所有字段');
      return;
    }

    try {
      // 1. 先调用 approve 授权给市场合约
      writeContract({
        address: nftAddress as Address,
        abi: erc721Abi,
        functionName: 'approve',
        args: [marketAddress, BigInt(tokenId)],
      });
      // 注意：这里我们只发起交易，后续的 listItem 会在 approve 成功后再触发
      // 一个更完善的流程会等待 approve 交易确认后再调用 listItem
      // 为了简化，这里我们假设用户会手动等待或者在UI上分开操作
    } catch (e) {
      console.error('Approve failed', e);
      alert(`授权失败: ${error?.message}`);
    }
  };
  
  // 监听 approve 交易的成功状态，成功后再调用 listItem
  const { data: approveHash, writeContract: approveWriteContract } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { data: listHash, writeContract: listWriteContract, isPending: isListing, error: listError } = useWriteContract();
  const { isLoading: isListConfirming, isSuccess: isListConfirmed } = useWaitForTransactionReceipt({ hash: listHash });

  // 当授权成功后，自动调用上架
  useEffect(() => {
    if (isApproveSuccess) {
      console.log('Approve confirmed, now listing...');
      listWriteContract({
        address: marketAddress,
        abi: NFTMarketAbi,
        functionName: 'listItem',
        args: [nftAddress as Address, BigInt(tokenId), parseUnits(price, 18)],
      });
    }
  }, [isApproveSuccess, listWriteContract, nftAddress, tokenId, price]);

  const handleListV2 = async () => {
     if (!address || !nftAddress || !tokenId || !price) return;
     approveWriteContract({
        address: nftAddress as Address,
        abi: erc721Abi,
        functionName: 'approve',
        args: [marketAddress, BigInt(tokenId)],
     })
  }


  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
      <h2 className="text-xl font-semibold">上架 NFT</h2>
      <input
        placeholder="NFT 合约地址"
        value={nftAddress}
        onChange={(e) => setNftAddress(e.target.value)}
        className="border p-2 mb-2 block w-full"
      />
      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        className="border p-2 mb-2 block w-full"
      />
      <input
        placeholder="价格 (TOKEN)"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 mb-2 block w-full"
      />
      <button 
        onClick={handleListV2} 
        disabled={isListing || isListConfirming}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        {isListing ? '等待钱包确认...' : isListConfirming ? '上架中...' : '上架 NFT'}
      </button>

      {isListConfirmed && <div style={{color: 'green', marginTop: '10px'}}>NFT 上架成功! Tx: {listHash}</div>}
      {listError && <div style={{color: 'red', marginTop: '10px'}}>上架失败: {listError.message}</div>}
    </div>
  );
}