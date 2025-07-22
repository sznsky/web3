import React from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export function ConnectWalletButton() {
  const { isConnected, address } = useAccount();
  const { openConnectModal, disconnect } = useAppKit();

  if (isConnected) {
    return (
      <div>
        <div>已连接钱包地址: {address}</div>
        <button onClick={() => disconnect()}>断开连接</button>
      </div>
    );
  }

  return <button onClick={() => openConnectModal()}>连接钱包</button>;
}
