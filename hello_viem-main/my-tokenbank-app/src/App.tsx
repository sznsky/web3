import { useEffect, useState } from "react";
import { createWalletClient, custom, parseUnits } from "viem";
import { defineChain } from "viem";
import { erc20Abi, type Address } from "viem";
import { createPublicClient, http } from "viem";
import { formatUnits } from "viem";
import TokenBankJson from "./abis/TokenBank.json";

// ------- 替换以下信息为你的合约 -------
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address;
const BANK_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as Address;
const TOKENBANK_ABI = TokenBankJson.abi;

// 定义 Anvil 本地链（默认端口）
const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'MyERC20', symbol: 'MYC', decimals: 18 },
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
  const [client, setClient] = useState<any>();
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // 防止重复连接

  // 初始化钱包
  const connectWallet = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);
      const [address] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(address);
      const walletClient = createWalletClient({
        chain: anvilChain,
        transport: custom(window.ethereum),
      });
      setClient(walletClient);
    } catch (err) {
      console.error("连接钱包失败:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalances = async () => {
    if (!account) return;
    const tokenBal = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
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
  };

  // 存款函数
  const deposit = async () => {
    if (!client || !account) return;

    const amount = parseUnits("1", 18); // 存款 1 个 Token

    // 1. 授权 TokenBank 调用代币
    await client.writeContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [BANK_ADDRESS, amount],
      account: account,
    });

    // 2. 调用 TokenBank 存款
    try{
      await client.writeContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "deposit",
        args: [amount],
        account: account,
      });
      fetchBalances();
    }catch(e){
      console.error("存款失败:", e);
    }
  };
 
  const withdraw = async () => {
    if (!client || !account) return;

    const amountStr = window.prompt("请输入要取款的数量（单位：Token）", "1");
    if (!amountStr) return;

    try {
      const amount = parseUnits(amountStr, 18);

      await client.writeContract({
        address: BANK_ADDRESS,
        abi: TOKENBANK_ABI,
        functionName: "withdraw",
        args: [amount],
        account,
      });

      fetchBalances();
    } catch (e) {
      console.error("取款失败:", e);
    }
  };

  

  useEffect(() => {
    if (account) {
      fetchBalances();
    }
  }, [account]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>TokenBank Demo</h2>
      {!account ? (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "连接中..." : "连接钱包"}
        </button>
      ) : (
        <div>
          <p>钱包地址: {account}</p>
          <p>Token 余额: {tokenBalance} MYC</p>
          <p>在 Bank 中存款: {bankBalance} MYC</p>
          <button onClick={deposit}>💰 存款 1 Token</button>
          <button onClick={withdraw}>🏧 取款</button>
        </div>
      )}
    </div>
  );
}

export default App;
