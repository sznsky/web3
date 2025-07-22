// src/App.tsx
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "./components/ConnectWalletButton";
import { ListNFT } from "./components/ListNFT";
import { BuyNFT } from "./components/BuyNFT";

// 模拟从合约读取到的商品列表
// 在实际应用中，你应该使用 wagmi 的 useReadContract 来从链上读取
interface Listing {
  id: number;
  nftAddress: string;
  tokenId: string;
  price: string; // 以 ether 为单位
  seller: string;
}

export default function App() {
  const { address } = useAccount();

  // 模拟一个上架的 NFT 列表
  // 理想情况下，这个列表应该从你的智能合约事件或读取函数中获取
  const [listings, setListings] = useState<Listing[]>([
      // 为了演示，我们硬编码一个商品
      { id: 1, nftAddress: "0x...", tokenId: "101", price: "0.01", seller: "0xSellerAddress" }
  ]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-2xl font-bold">My NFT Market</h1>
        <ConnectWalletButton />
      </header>

      <main style={{ marginTop: '2rem' }}>
        {address && <ListNFT />}

        <div className="listings-section" style={{ marginTop: '2rem' }}>
          <h2 className="text-xl font-semibold">市场上的 NFT</h2>
          {listings.length === 0 ? (
            <p>当前没有 NFT 在售。</p>
          ) : (
            listings.map((listing) => (
              // 购买者不能是卖家自己
              address && listing.seller.toLowerCase() !== address.toLowerCase() && (
                 <BuyNFT 
                    key={listing.id}
                    listingId={listing.id}
                    price={listing.price} 
                 />
              )
            ))
          )}
        </div>
      </main>
    </div>
  );
}