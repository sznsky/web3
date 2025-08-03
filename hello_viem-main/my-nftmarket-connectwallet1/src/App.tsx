import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';

// NFT市场合约ABI
import nftMarketABIJson from './abis/NFTMarket.json';
const nftMarketABI = nftMarketABIJson.abi;
const nftMarketAddress = '0x7fAE2F64a07796Cc8aB863BD079b9edE547E5eB4';

// ERC20合约ABI
import erc20ABIJson from './abis/MyERC20.json';
const erc20ABI = erc20ABIJson.abi;
const erc20TokenAddress = '0x9BDD1bAbFFf304cdc5329cCBb9c3Dc2CAb2D942b';

// NFT合约ABI
import myNftABIJson from './abis/MyERC721.json';
const myNftABI = myNftABIJson.abi;
const myNftAddress = '0xe5163A9acfe6C11522fd9b8A89D96735E5209b69';

function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [nftToList, setNftToList] = useState(null);
  const [listingToBuy, setListingToBuy] = useState(null);

  const {
    writeContract: approveNFT,
    data: approveNftHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();
  const { 
    writeContract: listNFT, 
    data: listNftHash,
    isPending: isListPending,
    error: listError,
  } = useWriteContract();
  const { writeContract: approveERC20, data: approveHash } = useWriteContract();
  const { writeContract: buyNFT, data: buyHash } = useWriteContract();

  // 查询 tokenId = 1 的 NFT
  const { 
    data: singleListing, 
    isPending: isSingleListingLoading, 
    error: singleListingError 
  } = useReadContract({
    address: nftMarketAddress,
    abi: nftMarketABI,
    functionName: 'getListing',
    args: [myNftAddress, BigInt(1)],
  });

  // NFT 授权交易监听
  useWaitForTransactionReceipt({
    hash: approveNftHash,
    onSuccess: () => {
      console.log('✅ NFT 授权成功！');
      alert('NFT 授权成功，正在发送上架请求...');
      if (nftToList) {
        // ❗❗❗ 上架交易触发前的日志 ❗❗❗
        console.log('🟢 准备触发上架交易...');
        console.log('listNFT 是否准备好:', !isListPending);
        console.log('上架参数:', {
          address: nftMarketAddress,
          functionName: 'list',
          args: [myNftAddress, nftToList.tokenId, nftToList.parsedPrice],
        });
        
        listNFT({
          address: nftMarketAddress,
          abi: nftMarketABI,
          functionName: 'list',
          args: [myNftAddress, nftToList.tokenId, nftToList.parsedPrice],
        });
        setNftToList(null);
      }
    },
    onError: (error) => {
      console.error('❌ NFT 授权失败:', error);
      alert('NFT 授权失败，请检查控制台');
      setNftToList(null);
    },
  });

  // NFT 上架交易监听
  useWaitForTransactionReceipt({
    hash: listNftHash,
    onSuccess: () => {
      console.log('✅ 上架交易成功！');
      alert('NFT 上架成功！');
      if (nftToList) {
        setTokenId('');
        setPrice('');
        setNftToList(null);
      }
    },
    onError: (error) => {
      console.error('❌ 上架失败:', error);
      alert('上架失败，请检查控制台');
    },
  });

  // 处理上架请求的即时错误
  useEffect(() => {
    if (listError) {
      console.error('⚠️ 上架请求触发时发生错误:', listError);
      alert(`上架请求触发失败：${listError.message}`);
    }
  }, [listError]);

  // 处理授权请求的即时错误
  useEffect(() => {
    if (approveError) {
      console.error('⚠️ 授权请求触发时发生错误:', approveError);
      alert(`授权请求触发失败：${approveError.message}`);
    }
  }, [approveError]);

  const handleListNFT = async () => {
    if (!isConnected || !tokenId || !price) {
      console.warn('⚠️ 钱包未连接或输入不完整');
      return;
    }

    try {
      const parsedTokenId = BigInt(tokenId);
      const parsedPrice = parseEther(price);
      setNftToList({ tokenId: parsedTokenId, parsedPrice });

      console.log('📦 上架流程开始...');
      console.log('NFT 合约地址:', myNftAddress);
      console.log('市场合约地址:', nftMarketAddress);
      console.log('Token ID:', parsedTokenId);

      const owner = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: myNftAddress,
            data: `0x6352211e${parsedTokenId.toString(16).padStart(64, '0')}`,
          },
          'latest',
        ],
      });

      const parsedOwner = '0x' + owner.slice(26);
      console.log('🔍 ownerOf tokenId:', parsedOwner);
      if (parsedOwner.toLowerCase() !== address.toLowerCase()) {
        alert(`你不是该 NFT 的拥有者（owner: ${parsedOwner}），无法授权`);
        return;
      }

      console.log('🟢 准备触发授权交易...');
      approveNFT({
        address: myNftAddress,
        abi: myNftABI,
        functionName: 'approve',
        args: [nftMarketAddress, parsedTokenId],
      });

      console.log('📨 授权交易已触发...');
      alert('NFT 授权请求已发送，请在钱包中确认。');
    } catch (error) {
      console.error('❌ 上架流程出错:', error);
      alert('上架流程失败，请检查控制台');
      setNftToList(null);
    }
  };

  useWaitForTransactionReceipt({
    hash: approveHash,
    onSuccess: () => {
      console.log('✅ ERC20 授权成功！');
      alert('ERC20 授权成功，即将发起购买');
      if (listingToBuy) {
        buyNFT({
          address: nftMarketAddress,
          abi: nftMarketABI,
          functionName: 'buyNFT',
          args: [listingToBuy.tokenId],
        });
      }
    },
    onError: (error) => {
      console.error('❌ ERC20 授权失败:', error);
      alert('ERC20 授权失败，请重试！');
    },
  });

  useWaitForTransactionReceipt({
    hash: buyHash,
    onSuccess: () => {
      console.log('✅ 购买交易成功！');
      alert('NFT 购买成功！');
      if (listingToBuy) {
        setListingToBuy(null);
      }
    },
    onError: (error) => {
      console.error('❌ 购买失败:', error);
      alert('购买失败，请检查控制台');
    },
  });

  const handleBuyNFT = async (tokenId, price, tokenAddress) => {
    if (!isConnected) return;
    try {
      setListingToBuy({ tokenId, price, tokenAddress });

      approveERC20({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'approve',
        args: [nftMarketAddress, price],
      });

      console.log('📨 ERC20 授权交易已发送...');
      alert('ERC20 授权请求已发送，请在钱包中确认。');
    } catch (error) {
      console.error('❌ 购买流程失败:', error);
      alert('购买流程失败，请检查控制台');
      setListingToBuy(null);
    }
  };

  const isNftListed = singleListing && singleListing.seller !== '0x0000000000000000000000000000000000000000';

  return (
    <div>
      <h1>NFT 钱包页面</h1>
      <w3m-button />

      {isConnected && (
        <>
          <p>钱包地址: {address}</p>
          <button onClick={() => disconnect()}>断开连接</button>
          <hr />

          <h2>上架 NFT</h2>
          <input
            type="text"
            placeholder="Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
          <input
            type="text"
            placeholder="价格 (ERC20)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button onClick={handleListNFT}>上架</button>
          <hr />

          <h2>上架的 NFT </h2>
          {isSingleListingLoading ? (
            <p>正在查询 tokenId = 1...</p>
          ) : singleListingError ? (
            <p>查询失败: {singleListingError.message}</p>
          ) : isNftListed ? (
            <div>
              <p>Token ID: 1</p>
              <p>价格: {formatEther(singleListing.price)} (ERC20)</p>
              <button onClick={() => handleBuyNFT(BigInt(1), singleListing.price, erc20TokenAddress)}>
                购买
              </button>
            </div>
          ) : (
            <p> 没有上架的NFT。</p>
          )}
        </>
      )}
    </div>
  );
}

export default App;