import { useEffect, useState } from "react";
import {
  createWalletClient,
  custom,
  parseUnits,
  defineChain,
  createPublicClient,
  http,
  formatUnits,
  type Address,
  // ❗ 注意：在 viem@2.33.0 中，signatureToRsv 不是直接可用的命名导出
  // 因此这里不再导入 signatureToRsv
  type WalletClient // 引入 WalletClient 类型以增强类型安全性
} from "viem";
import TokenBankJson from "./abis/TokenBank.json";
import MyERC20PermitJson from "./abis/MyERC20Permit.json";

// ------- 替換以下資訊為你的合約 -------
const TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as Address;
const BANK_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as Address;
const TOKENBANK_ABI = TokenBankJson.abi;
const MY_ERC20_PERMIT_ABI = MyERC20PermitJson.abi;

const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  },
});

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
});

function App() {
  const [account, setAccount] = useState<Address>();
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [bankBalance, setBankBalance] = useState<string>("0");
  // 将 client 的类型从 any 更改为 WalletClient | undefined
  const [client, setClient] = useState<WalletClient | undefined>();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connectWallet = async () => {
    if (isConnecting) return;
    try {
      setIsConnecting(true);
      // 确保 window.ethereum 可用
      if (!window.ethereum) {
        alert("请安装 MetaMask 或其他以太坊钱包。");
        return;
      }
      const [address] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(address);
      const walletClient = createWalletClient({
        chain: anvilChain,
        transport: custom(window.ethereum as any),
      });
      setClient(walletClient);
    } catch (err) {
      console.error("连接钱包失败:", err);
      alert("连接钱包失败，请检查控制台。");
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalances = async () => {
    if (!account) return;
    try {
      const tokenBal = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: MY_ERC20_PERMIT_ABI,
        functionName: "balanceOf",
        args: [account],
      });
      const bankBal = await publicClient.readContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "getBalance",
        args: [account],
      });
      setTokenBalance(formatUnits(tokenBal, 18));
      setBankBalance(formatUnits(bankBal, 18));
    } catch (error) {
      console.error("获取余额失败:", error);
      // 可以选择性地显示错误给用户
    }
  };

  const depositWithPermit = async () => {
    if (!client || !account) {
      alert("请先连接钱包。");
      return;
    }

    const amount = parseUnits("1", 18);
    // 截止时间设置为当前时间 + 20 分钟
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    try {
      const [name, nonce, chainId] = await Promise.all([
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MY_ERC20_PERMIT_ABI,
          functionName: "name",
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MY_ERC20_PERMIT_ABI,
          functionName: "nonces",
          args: [account],
        }),
        publicClient.getChainId(),
      ]);

      const domain = {
        name: name as string,
        version: "1",
        chainId: chainId,
        verifyingContract: TOKEN_ADDRESS,
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: account,
        spender: BANK_ADDRESS,
        value: amount,
        nonce: nonce as bigint,
        deadline: deadline,
      };

      // 钱包签名 EIP-712 类型化数据
      const signature = await client.signTypedData({
        account,
        domain,
        types,
        primaryType: "Permit",
        message,
      });

      // ❗ [关键修正] 在 viem@2.33.0 中手动解析签名获取 r, s, v
      // 签名的格式通常是 0x + R (32字节) + S (32字节) + V (1字节)
      const r = `0x${signature.substring(2, 66)}`;
      const s = `0x${signature.substring(66, 130)}`;
      const v = `0x${signature.substring(130, 132)}`; // v 是最后两个字符

      // 将 v 转换为数字，因为 Solidity 合约通常接受 uint8
      // 确保 v 是 27 或 28 (对于 EIP-155 之前的交易，或恢复为 0/1)
      const v_number = Number(v);

      console.log("签名已生成, r, s, v:", { r, s, v: v_number });

      console.log("正在呼叫 permitDeposit...");
      const hash = await client.writeContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "permitDeposit",
        // 注意：这里 r 和 s 必须以 Address 类型传递，因为它们在 Solidity 中通常是 bytes32，
        // 但在 Viem 的类型中可能被推断为 Address 或 Bytes。如果合约接受 bytes32，
        // 最好确保类型匹配，不过对于字符串形式的十六进制值，通常会正确处理。
        args: [account, amount, deadline, v_number, r as Address, s as Address],
        account: account,
      });

      console.log("交易已发送, hash:", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log("交易已确认!");

      fetchBalances(); // 交易确认后更新余额
    } catch (e) {
      console.error("Permit 存款失败:", e);
      alert("Permit 存款失败，详情请看控制台。");
    }
  };

  const withdraw = async () => {
    if (!client || !account) {
      alert("请先连接钱包。");
      return;
    }

    const amountToWithdraw = parseUnits("0.5", 18); // 假设取款 0.5 SUN
    try {
      console.log(`正在从 Bank 取款 ${formatUnits(amountToWithdraw, 18)} SUN...`);
      const hash = await client.writeContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "withdraw",
        args: [amountToWithdraw],
        account: account,
      });

      console.log("取款交易已发送, hash:", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log("取款交易已确认!");

      fetchBalances(); // 取款确认后更新余额
    } catch (e) {
      console.error("取款失败:", e);
      alert("取款失败，详情请看控制台。");
    }
  };

  // 当 account 变化时，或者组件挂载时，如果 account 存在，就获取余额
  useEffect(() => {
    if (account) {
      fetchBalances();
    }
    // 添加一个监听器来处理账户切换或网络切换
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: Address[]) => {
        if (accounts.length === 0) {
          setAccount(undefined);
          setClient(undefined);
          setTokenBalance("0");
          setBankBalance("0");
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // 当链变化时，重新连接或刷新数据
        setAccount(undefined); // 清空账户，促使重新连接
        setClient(undefined);
        connectWallet(); // 尝试重新连接钱包
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        // 清理事件监听器
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account, client]); // 将 client 也加入依赖，确保在 client 实例化后能正常调用

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "auto", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
        TokenBank Demo (EIP2612 Permit)
      </h2>
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            opacity: isConnecting ? 0.7 : 1
          }}
        >
          {isConnecting ? "连线中..." : "连接钱包"}
        </button>
      ) : (
        <div>
          <p style={{ fontWeight: "bold" }}>钱包地址: <span style={{ color: "#007bff", wordBreak: "break-all" }}>{account}</span></p>
          <p style={{ fontWeight: "bold" }}>Token 余额: <span style={{ color: "#28a745" }}>{tokenBalance} SUN</span></p>
          <p style={{ fontWeight: "bold" }}>在 Bank 中存款: <span style={{ color: "#ffc107" }}>{bankBalance} SUN</span></p>
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={depositWithPermit}
              style={{
                padding: "10px 15px",
                fontSize: "14px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              💰 使用签名存款 1 SUN
            </button>
            <button
              onClick={withdraw}
              style={{
                padding: "10px 15px",
                fontSize: "14px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              🏧 取款 0.5 SUN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;