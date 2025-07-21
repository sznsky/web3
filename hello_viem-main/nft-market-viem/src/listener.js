// 导入 viem 中的必要模块
import { createPublicClient, http, parseAbiItem } from 'viem';

import { defineChain } from 'viem'

const foundry = defineChain({
  id: 31337,
  name: 'Foundry',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
})


// 1. 创建一个 Public Client
// Public Client 用于与区块链进行只读交互。
// 我们通过 http transport 连接到一个公共的 RPC 提供商 (例如 Alchemy, Infura, 或公共 RPC)。
// 这里我们使用以太坊主网 (mainnet) 的默认公共 RPC。


// 创建一个公共客户端
const client = createPublicClient({
  chain: foundry, // 指定链
  transport: http(), // 这里修改为指定的 RPC 地址
});


// 2. 定义你要监听的合约地址和 ABI
const contractAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'; // 这里替换为你的合约地址

// ERC-20 Transfer 事件的 ABI 定义。
// event Transfer(address indexed from, address indexed to, uint256 value);
// 你只需要提供你想监听的那个事件的 ABI 定义即可。
//const transferAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// --- 事件 1: 监听 NFT 市场的上架 (list) ---
const listAbi = parseAbiItem('event NFTListed(address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price)');
console.log(`🚀 开始监听合约 ${contractAddress} 的 list 事件...`);

const listUnwatch = client.watchContractEvent({
  address: contractAddress,
  abi: [listAbi], // 注意：abi 需要是一个数组
  eventName: 'NFTListed',
  onLogs: (logs) => {
    console.log('监听收到新的 list 事件!');
    logs.forEach(log => {
      console.log("log.args = ", log.args);
      const args = log.args || {};
      console.log('---------------------------------');
      console.log(`   - 交易哈希 (Tx Hash): ${log.transactionHash}`);
      console.log(`   - NFT 合约: ${args.nftContract}`);
      console.log(`   - Token ID: ${args.tokenId?.toString?.()}`);
      console.log(`   - 卖家地址: ${args.seller}`);
      console.log(`   - 上架价格: ${args.price?.toString?.()} wei`);
      console.log('---------------------------------\n');
    });
  },
  onError: (error) => {
    console.error('list监听时发生错误:', error);
  },
});


// --- 事件 2: 监听 NFT 的买卖事件 ---
const buyNFTAbi = parseAbiItem('event NFTSold(address indexed nftContract, uint256 indexed tokenId, address seller, address indexed buyer, uint256 price)');

const buyNFTUnwatch = client.watchContractEvent({
  address: contractAddress,
  abi: [buyNFTAbi],
  eventName: 'NFTSold',
  onLogs: (logs) => {
    console.log('监听收到新的 buyNFT 事件!');
    logs.forEach(log => {
      console.log("log.args =", log.args);  // <--- 先看看数据结构
      const { nftContract, tokenId, seller, buyer, price } = log.args;
      console.log('---------------------------------');
      console.log(`   - 交易哈希 (Tx Hash): ${log.transactionHash}`);
      console.log(`   - NFT 合约: ${nftContract}`);
      console.log(`   - Token ID: ${tokenId ? tokenId.toString() : 'undefined'}`);
      console.log(`   - 卖家: ${seller}`);
      console.log(`   - 买家: ${buyer}`);
      console.log(`   - 成交价格: ${price ? price.toString() : 'undefined'} wei`);
      console.log('---------------------------------\n');
    });
  },
  onError: (error) => {
    console.error('buyNFT监听时发生错误:', error);
  },
});

console.log('所有的监听器已启动。等待新事件...');

// 你可以设置一个优雅的关闭逻辑
process.on('SIGINT', () => {
  console.log('正在停止监听器...');
  listUnwatch(); // 调用 unwatch() 函数来停止监听
  buyNFTUnwatch(); // 调用 unwatch() 函数来停止监听
  console.log('监听器已停止。');
  process.exit(0);
});