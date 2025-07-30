// =================================================================
// App.tsx - 完整且可直接运行的修复版本
// =================================================================
import { useEffect, useState } from "react";
import {
  createWalletClient,
  custom,
  parseUnits,
  defineChain,
  createPublicClient,
  http,
  formatUnits,
  maxUint256, // <-- 引入 maxUint256 用于最大授权
  type Address,
  type WalletClient,
} from "viem";
import TokenBankJson from "./abis/TokenBank.json";
import SUNTokenJson from "./abis/SUNToken.json";

// ------- 替换以下信息为你的合约 (请确保这些地址已部署到 Sepolia 测试网) -------
const TOKEN_ADDRESS = "0x949b1F766362dB5141B0b1517878e059b5F06262" as Address; // 替换为你在Sepolia上部署的SUNToken地址
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address; // Sepolia 上的 Permit2 官方地址
const BANK_ADDRESS = "0x6Ed5E9eEab8BCfE37963E1044dD1818dEC100F35" as Address; // 替换为你在Sepolia上部署的TokenBank地址
const TOKENBANK_ABI = TokenBankJson.abi;
const SUNToken_ABI = SUNTokenJson.abi;

// --- Sepolia 测试网的配置 ---
// 请替换 YOUR_ALCHEMY_API_KEY 为你自己的 Alchemy 或 Infura API Key
const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/y_oohbF92oDh0B0wjFwl94sa0jXXEbFv"; // <-- 在这里粘贴你的 Sepolia RPC URL

const sepoliaChain = defineChain({
  id: 11155111, // Sepolia 的链 ID
  name: 'Sepolia Testnet', // 链的名称
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, // 原生货币信息
  rpcUrls: {
    default: { http: [SEPOLIA_RPC_URL] }, // 指向 Sepolia 的 RPC URL
    public: { http: [SEPOLIA_RPC_URL] }, // 可选的公共 RPC URL
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
});

const publicClient = createPublicClient({
  chain: sepoliaChain,
  transport: http(SEPOLIA_RPC_URL),
});

function App() {
  const [account, setAccount] = useState<Address>();
  const [client, setClient] = useState<WalletClient>();
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [bankBalance, setBankBalance] = useState<string>("0");

  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isDepositing, setIsDepositing] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // --- 1. 连接钱包函数 ---
  const connectWallet = async () => {
    if (isConnecting) return;
    try {
      setIsConnecting(true);
      if (!window.ethereum) {
        alert("请安装 MetaMask 或其他以太坊钱包。");
        setIsConnecting(false);
        return;
      }
      const [address] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const walletClient = createWalletClient({
        account: address,
        chain: sepoliaChain,
        transport: custom(window.ethereum),
      });
      setAccount(address);
      setClient(walletClient);
    } catch (err) {
      console.error("连接钱包失败:", err);
      alert("连接钱包失败，请检查浏览器控制台。");
    } finally {
      setIsConnecting(false);
    }
  };

  // --- 2. 查询余额函数 ---
  const fetchBalances = async () => {
    if (!account) return;
    setIsLoadingBalance(true);
    try {
      const tokenBal = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: SUNToken_ABI,
        functionName: "balanceOf",
        args: [account],
      });
      setTokenBalance(formatUnits(tokenBal as bigint, 18));

      const bankBal = await publicClient.readContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "getBalance",
        args: [TOKEN_ADDRESS, account],
      });
      setBankBalance(formatUnits(bankBal as bigint, 18));
    } catch (error) {
      console.error("获取余额失败:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // --- 3. (新增) 授权 Permit2 函数 ---
  const approvePermit2 = async () => {
    if (!client || !account) return alert("请先连接钱包。");
    // 使用 isDepositing state 来跟踪加载状态，避免用户同时点击多个按钮
    setIsDepositing('approve'); 
    try {
      const hash = await client.writeContract({
        address: TOKEN_ADDRESS,
        abi: SUNToken_ABI,
        functionName: "approve",
        args: [PERMIT2_ADDRESS, maxUint256], // 授权最大值给 Permit2 合约
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      alert("Permit2 授权成功！现在你可以使用 Permit2 存款了。");
    } catch (e) {
      console.error("Permit2 授权失败:", e);
      alert("Permit2 授权失败，详情请看控制台。");
    } finally {
      setIsDepositing(null); // 重置加载状态
    }
  };

  // --- 4. Permit2 存款函数 ---
  const depositWithPermit2 = async () => {
    if (!client || !account) return alert("请先连接钱包。");
    setIsDepositing('permit2');
    const amount = parseUnits("1", 18);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20分钟后过期
    try {
      // 检查 allowance，如果不足可以提示用户先授权
      const allowance = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: SUNToken_ABI,
        functionName: 'allowance',
        args: [account, PERMIT2_ADDRESS]
      }) as bigint;

      if (allowance < amount) {
          alert('Permit2 授权额度不足。请先点击 "授权 Permit2" 按钮。');
          setIsDepositing(null);
          return;
      }
        
      const domain = { name: "Permit2", chainId: sepoliaChain.id, verifyingContract: PERMIT2_ADDRESS };
      const types = {
        PermitTransferFrom: [
          { name: "permitted", type: "TokenPermissions" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
        TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
      };
      const nonce = BigInt(Math.floor(Date.now() / 1000)) * 1000n + BigInt(Math.floor(Math.random() * 1000));

      // permitMessageForSigning 包含 spender，用于 EIP-712 签名
      const permitMessageForSigning = {
        permitted: { token: TOKEN_ADDRESS, amount },
        spender: BANK_ADDRESS, // Permit2 的 spender 是 TokenBank
        nonce,
        deadline
      };

      // 签名 Permit 消息
      const signature = await client.signTypedData({
        account, // 这里是签名者
        domain,
        types,
        primaryType: "PermitTransferFrom",
        message: permitMessageForSigning
      });

      // --- 关键修改：构建与合约 ABI 精确匹配的 permit 对象 ---
      // 合约的 depositWithPermit2 函数的第一个参数 `permit` 是 ISignatureTransfer.PermitTransferFrom 类型
      // 这个结构体在 ABI 中只包含 permitted, nonce, deadline 字段，不包含 spender
      const permitToContract = {
        permitted: {
          token: TOKEN_ADDRESS,
          amount: amount // 使用 parseUnits 后的 bigint 类型的 amount
        },
        nonce: nonce,
        deadline: deadline
      };

      // transferDetails 对象已经匹配合约 ABI，不需要修改
      const transferDetails = {
        to: BANK_ADDRESS,
        requestedAmount: amount // 使用 parseUnits 后的 bigint 类型的 amount
      };

      // 调用合约的 depositWithPermit2 函数，现在传入四个参数
      const hash = await client.writeContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "depositWithPermit2",
        args: [
          permitToContract,
          transferDetails,
          account, // <-- 新增的第四个参数：Permit 消息的签名者/所有者
          signature
        ],
        account, // 交易的发送者 (msg.sender)
      });
      await publicClient.waitForTransactionReceipt({ hash });
      fetchBalances();
      alert("Permit2 存款成功！");
    } catch (e) {
      console.error("Permit2 存款失败:", e);
      alert("Permit2 存款失败，详情请看控制台。");
    } finally {
      setIsDepositing(null);
    }
  };

  // --- 5. 取款函数 ---
  const withdraw = async () => {
      if (!client || !account) return alert("请先连接钱包。");
    setIsWithdrawing(true);
    const amountToWithdraw = parseUnits("0.5", 18);
    try {
      const hash = await client.writeContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "withdraw",
        args: [TOKEN_ADDRESS, amountToWithdraw],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      fetchBalances();
    } catch (e) {
      console.error("取款失败:", e);
      alert("取款失败，详情请看控制台。");
    } finally {
      setIsWithdrawing(false);
    }
  
  };

  // --- React Hooks ---
  useEffect(() => {
    if (account) {
      fetchBalances();
    } else {
      setTokenBalance("0");
      setBankBalance("0");
    }
  }, [account]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0] as Address;
        setAccount(newAccount);
        const newClient = createWalletClient({ account: newAccount, chain: sepoliaChain, transport: custom(window.ethereum!) });
        setClient(newClient);
      } else {
        setAccount(undefined);
        setClient(undefined);
      }
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const isActionInProgress = !!isDepositing || isWithdrawing || isLoadingBalance;

  // --- UI Rendering ---
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "auto", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
        TokenBank Demo (Permit & Permit2)
      </h2>
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          style={{ padding: "10px 20px", fontSize: "16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", opacity: isConnecting ? 0.7 : 1 }}
        >
          {isConnecting ? "连接中..." : "连接钱包"}
        </button>
      ) : (
        <div>
          <p style={{ fontWeight: "bold" }}>钱包地址: <span style={{ color: "#007bff", wordBreak: "break-all" }}>{account}</span></p>
          <p style={{ fontWeight: "bold" }}>Token 余额: <span style={{ color: "#28a745" }}>{isLoadingBalance ? '加载中...' : `${tokenBalance} SUN`}</span></p>
          <p style={{ fontWeight: "bold" }}>在 Bank 中存款: <span style={{ color: "#ffc107" }}>{isLoadingBalance ? '加载中...' : `${bankBalance} SUN`}</span></p>
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* --- 新增的授权按钮 --- */}
            <button
              onClick={approvePermit2}
              disabled={isActionInProgress}
              style={{ padding: "10px 15px", fontSize: "14px", backgroundColor: "#6f42c1", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              {isDepositing === 'approve' ? '授权中...' : '1. (一次性) 授权 Permit2'}
            </button>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={depositWithPermit2}
                disabled={isActionInProgress}
                style={{ padding: "10px 15px", fontSize: "14px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", flex: 1 }}
              >
                {isDepositing === 'permit2' ? '存款中...' : '2. 🔄 使用 Permit2 存款 1 SUN'}
              </button>
            </div>
            
            <button
              onClick={withdraw}
              disabled={isActionInProgress}
              style={{ padding: "10px 15px", fontSize: "14px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              {isWithdrawing ? '取款中...' : '🏧 取款 0.5 SUN'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;