// 导入所需模块
import { createPublicClient, createWalletClient, http, formatEther, parseUnits, getContract } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'; // 自动加载 .env 文件

// --- 配置 ---

// process.cwd() 指的进入当前项目的根目录
const WALLET_FILE = path.join(process.cwd(), 'wallet.json');

const ERC20_TOKEN_ADDRESS = '0xF6Aa330E8E016eB847EE8F6F01775F556448044b';

const erc20Abi = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable', // transfer 函数会修改状态，所以是 non-payable
    type: 'function',
  },
];


// --- viem 客户端初始化
// 检查SEPOLIA_RPC_URL是否配置
if(!process.env.SEPOLIA_RPC_URL) {
    // 生产环境
    console.error(chalk.red('请设置 .env 中配置SEPOLIA_RPC_URL变量'));
    process.exit(1);
}

// 创建一个公共的客户端，读取区块链的余额
const publicClient = createPublicClient({
    chain: 'sepolia',
    transport: http(process.env.SEPOLIA_RPC_URL),
});


// 加载钱包信息
async function loadWallet() {
    try {
        const data = await fs.readFile(WALLET_FILE);
        const wallet = JSON.parse(data);
        if (!wallet.privateKey) {
            console.error(chalk.red('钱包文件格式不正确，请检查 wallet.json 文件'));
        }
        return privateKeyToAccount(wallet.privateKey);
    } catch (error) {
        return null;
    }
}

// 保存钱包信息
async function saveWallet(account) {
    const wallet = {
        privateKey: account.privateKey,
        address: account.address,
    };
    await fs.writeFile(WALLET_FILE, JSON.stringify(wallet, null, 2));
}

// --CLI 命令行交互
yargs(hideBin(process.argv))
  .scriptName("cli-wallet")
  .usage('$0 <cmd> [args]')
  
   // 1. generate 命令
  .command('generate', '生成一个新的以太坊钱包并保存', async () => {
        console.log(chalk.yellow('正在生成新钱包...'));
        
        // 1. 使用 viem 的内置函数生成私钥
        const privateKey = generatePrivateKey();
        
        // 2. 从生成的私钥创建账户对象
        const account = privateKeyToAccount(privateKey);

        await saveWallet(account);
        console.log(chalk.green('钱包生成成功并已保存至 wallet.json!'));
        console.log(chalk.bold('地址:'), chalk.cyan(account.address));
        // 现在 account.privateKey 将会有正确的值
        console.log(chalk.bold.red('私钥:'), chalk.red(privateKey));
        console.log(chalk.yellow.bold('\n重要提示: 请妥善保管您的私钥！不要与任何人分享！'));
    })

  // 2. balance 命令
  .command('balance', '查询钱包的 ETH 和 ERC20 代币余额', async () => {
    const account = await loadWallet();
    if (!account) {
      console.error(chalk.red('错误：找不到钱包。请先运行 "generate" 命令。'));
      return;
    }

    console.log(chalk.blue(`查询地址: ${account.address}`));
    console.log(chalk.yellow('正在获取余额...'));

    try {
      // 获取 ETH 余额
      const ethBalance = await publicClient.getBalance({ address: account.address });
      console.log(chalk.bold('ETH 余额:'), chalk.green(`${formatEther(ethBalance)} ETH`));
      
      // 获取 ERC20 代币信息和余额
      const token = getContract({ address: ERC20_TOKEN_ADDRESS, abi: erc20Abi, client: publicClient });
      const [symbol, decimals, balance] = await Promise.all([
        token.read.symbol(),
        token.read.decimals(),
        token.read.balanceOf([account.address]),
      ]);

      console.log(chalk.bold(`${symbol} (ERC20) 余额:`), chalk.green(`${formatEther(balance, decimals)} ${symbol}`));

    } catch (error) {
      console.error(chalk.red('查询余额失败:'), error.message);
    }
  })

  // 3. transfer 命令
  .command('transfer <to> <amount>', '发送 ERC20 代币到指定地址', (yargs) => {
    return yargs
      .positional('to', { type: 'string', describe: '接收方地址' })
      .positional('amount', { type: 'string', describe: '转账金额' });
  }, async (argv) => {
    const account = await loadWallet();
    if (!account) {
      console.error(chalk.red('错误：找不到钱包。请先运行 "generate" 命令。'));
      return;
    }
    
    console.log(chalk.yellow(`准备发送 ${argv.amount} ERC20 代币到 ${argv.to}...`));

    try {
      // 创建一个钱包客户端，用于签名和发送交易
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(process.env.SEPOLIA_RPC_URL),
      });

      const tokenDecimals = await publicClient.readContract({
        address: ERC20_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'decimals',
      });

      // 构建 EIP-1559 交易
      console.log(chalk.blue('正在构建和模拟交易...'));
      const { request } = await publicClient.simulateContract({
        account,
        address: ERC20_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [argv.to, parseUnits(argv.amount, tokenDecimals)],
        // viem 会自动处理 EIP-1559 相关的 gas 费用估算
      });

      console.log(chalk.blue('请确认交易... 正在签名并发送...'));
      
      // 签名并发送交易
      const txHash = await walletClient.writeContract(request);

      console.log(chalk.green.bold('\n交易发送成功!'));
      console.log(chalk.bold('交易哈希:'), chalk.cyan(txHash));
      console.log(chalk.bold('在 Etherscan 上查看:'), `https://sepolia.etherscan.io/tx/${txHash}`);

      console.log(chalk.yellow('\n正在等待交易确认...'));
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status === 'success') {
        console.log(chalk.green.bold('交易已在链上确认!'));
        console.log(chalk.bold('区块号:'), receipt.blockNumber.toString());
      } else {
         console.log(chalk.red.bold('交易失败。'));
      }

    } catch (error) {
      console.error(chalk.red('转账失败:'), error.shortMessage || error.message);
    }
  })
  .demandCommand(1, '您必须提供一个命令。使用 --help 查看可用命令。')
  .help()
  .argv;


