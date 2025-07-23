import React from "react";
import ConnectWalletButton from "./components/ConnectWalletButton";
import ListNFT from "./components/ListNFT";
import BuyNFT from "./components/BuyNFT";

function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1>NFTMarket Demo</h1>
      <ConnectWalletButton />
      <ListNFT />
      <BuyNFT />
    </div>
  );
}

export default App;