// =================================================================
// App.tsx - 完整且可直接运行的版本
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
  type Address,
  type WalletClient,
} from "viem";
import TokenBankJson from "./abis/TokenBank.json";
import SUNTokenJson from "./abis/SUNToken.json";

// ------- 替换以下信息为你的合约 -------
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address;
const PERMIT2_ADDRESS = "0x8464135c8F25Da09e49BC8782676a84730C318bC" as Address;
const BANK_ADDRESS = "0x663F3ad617193148711d28f5334eE4Ed07016602" as Address;
const TOKENBANK_ABI = TokenBankJson.abi;
const SUNToken_ABI = SUNTokenJson.abi;


const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
});

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
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
  
  // --- 1. 连接钱包函数 (完整实现) ---
  const connectWallet = async () => {
    console.log("尝试连接钱包..."); // 调试信息
    if (isConnecting) return;
    try {
      setIsConnecting(true);
      if (!window.ethereum) {
        alert("请安装 MetaMask 或其他以太坊钱包。");
        setIsConnecting(false); // 重置状态
        return;
      }
      const [address] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const walletClient = createWalletClient({
        account: address,
        chain: anvilChain,
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

  // --- 2. 查询余额函数 (完整实现) ---
const fetchBalances = async () => {
  if (!account) return;
  setIsLoadingBalance(true);
  try {
     // 检查合约代码是否存在

    const bankCode = await publicClient.getBytecode({ address: BANK_ADDRESS });
    console.log("Bank contract code:", bankCode ? "Exists" : "Missing", "at address", BANK_ADDRESS);

    
    // 检查函数是否存在于ABI
    const functionExists = TOKENBANK_ABI.some(
      item => item.type === "function" && item.name === "getBalance"
    );
    console.log("getBalance function exists:", functionExists);


    const tokenBal = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: SUNToken_ABI,
      functionName: "balanceOf",
      args: [account],
    });
    setTokenBalance(formatUnits(tokenBal as bigint, 18));

    // 暂时注释掉这部分以隔离问题
    const bankBal = await publicClient.readContract({
      address: BANK_ADDRESS,
      abi: TOKENBANK_ABI,
      functionName: "getBalance",
      args: [TOKEN_ADDRESS, account],
    });
    setBankBalance(formatUnits(bankBal as bigint, 18));
    //setBankBalance("N/A - 调试中"); // 暂时设置一个占位符

  } catch (error) {
    console.error("获取余额失败:", error);
  } finally {
    setIsLoadingBalance(false);
  }
};



  // --- 3. Permit2 存款函数 (完整实现) ---
  const depositWithPermit2 = async () => {
    if (!client || !account) return alert("请先连接钱包。");
    setIsDepositing('permit2');
    const amount = parseUnits("1", 18);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    try {
        const domain = { name: "Permit2", chainId: anvilChain.id, verifyingContract: PERMIT2_ADDRESS };
        const types = {
            PermitTransferFrom: [
                { name: "permitted", type: "TokenPermissions" }, { name: "spender", type: "address" },
                { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" },
            ],
            TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
        };
        const nonce = BigInt(Date.now());
        const permitMessage = { permitted: { token: TOKEN_ADDRESS, amount }, spender: BANK_ADDRESS, nonce, deadline };
        const signature = await client.signTypedData({ account, domain, types, primaryType: "PermitTransferFrom", message: permitMessage });
        const permit = permitMessage;
        const transferDetails = { to: BANK_ADDRESS, requestedAmount: amount };
        const hash = await client.writeContract({ address: BANK_ADDRESS, abi: TOKENBANK_ABI, functionName: "depositWithPermit2", args: [permit, transferDetails, signature], account });
        await publicClient.waitForTransactionReceipt({ hash });
        fetchBalances();
    } catch (e) {
        console.error("Permit2 存款失败:", e);
        alert("Permit2 存款失败，详情请看控制台。");
    } finally {
        setIsDepositing(null);
    }
  };

  // --- 4. 取款函数 (完整实现) ---
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

  // (注：此处省略了您的 depositWithPermit 函数，如果您需要它，请确保它也是完整实现)


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
        const newClient = createWalletClient({ account: newAccount, chain: anvilChain, transport: custom(window.ethereum!) });
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
            <div style={{ display: "flex", gap: "10px" }}>
              {/* <button onClick={() => depositWithPermit()} disabled={isActionInProgress}>...</button> */}
              <button
                onClick={depositWithPermit2}
                disabled={isActionInProgress}
                style={{ padding: "10px 15px", fontSize: "14px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", flex: 1 }}
              >
                {isDepositing === 'permit2' ? '存款中...' : '🔄 使用 Permit2 存款 1 SUN'}
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