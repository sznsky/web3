import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div>
      {isConnected ? (
        <div>
          <span>已连接: {address}</span>
          <button onClick={() => disconnect()}>断开连接</button>
        </div>
      ) : (
        connectors.map((connector) => (
          <button
            disabled={!connector.ready}
            key={connector.id}
            onClick={() => connect({ connector })}
          >
            连接钱包（{connector.name}）
            {isLoading && pendingConnector?.id === connector.id && " (连接中...)"}
          </button>
        ))
      )}
    </div>
  );
}