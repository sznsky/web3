import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatUnits } from 'viem'; // 导入 formatUnits

// 定义交易数据类型，与后端返回的JSON结构对应
interface Transaction {
  id: number;
  txHash: string;
  from: string;
  to: string;
  value: string; // value通常是字符串，因为是big.Int
  blockNum: number;
  logIndex: number;
  timestamp: string; // 时间戳可以作为字符串显示
  tokenAddress: string;
}

// 定义代币的小数位数，根据你的需求这里设置为18
const TOKEN_DECIMALS = 18;
// 定义代币的符号
const TOKEN_SYMBOL = "SUN";

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当钱包连接状态或地址发生变化时，查询交易
  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions(address);
    } else {
      setTransactions([]); // 如果没有连接钱包，清空交易列表
      setError(null);
    }
  }, [isConnected, address]);

  const fetchTransactions = async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      // 替换为你的后端服务地址
      const backendUrl = `http://localhost:8080/transactions/${walletAddress}`;
      console.log(`Fetching transactions from: ${backendUrl}`); // 打印请求URL

      const response = await fetch(backendUrl);
      if (!response.ok) {
        // 如果HTTP状态码不是2xx，抛出错误
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data: Transaction[] = await response.json();
      setTransactions(data);
      console.log('Transactions fetched:', data); // 打印获取到的数据
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      if (err instanceof Error) {
        setError(`Failed to fetch transactions: ${err.message}`);
      } else {
        setError('An unknown error occurred while fetching transactions.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Web3 交易查询</h2>

      {/* 钱包连接/断开区域 */}
      <div>
        {isConnected ? (
          <>
            <p>已连接钱包: <strong>{address}</strong></p>
            <button onClick={() => disconnect()}>断开连接</button>
          </>
        ) : (
          <button onClick={() => connect({ connector: injected() })}>连接 MetaMask</button>
        )}
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* 交易列表区域 */}
      {isConnected && (
        <div>
          <h4>最新交易记录 ({address})</h4>
          {loading && <p>加载中...</p>}
          {error && <p style={{ color: 'red' }}>错误: {error}</p>}
          {!loading && !error && transactions.length === 0 && (
            <p>未找到相关交易。</p>
          )}
          {!loading && !error && transactions.length > 0 && (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {transactions.map((tx) => (
                <li
                  key={tx.txHash + tx.logIndex}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '8px', // 稍微减小内边距
                    marginBottom: '8px', // 稍微减小外边距
                    fontSize: '0.9em' // 列表项整体字体小一点
                  }}
                >
                  {/* 将所有 P 标签的字体大小调小 */}
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>哈希:</strong> {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>来自:</strong> {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>去往:</strong> {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                  </p>
                  {/* 使用 formatUnits 格式化金额，并设置 fractionDigits: 0 只显示整数 */}
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>金额:</strong>{' '}
                    {formatUnits(BigInt(tx.value), TOKEN_DECIMALS, { fractionDigits: 0 })}{' '} {/* 设置 fractionDigits: 0 */}
                    {TOKEN_SYMBOL} {/* 显示代币符号 */}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>区块号:</strong> {tx.blockNum}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>时间:</strong> {new Date(tx.timestamp).toLocaleString()}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                    <strong>代币地址:</strong> {tx.tokenAddress.slice(0, 8)}...{tx.tokenAddress.slice(-6)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;