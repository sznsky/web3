import {ethers} from "ethers";

console.log(ethers.getNumber("12121212"));

// 查询本地的
let provider = new ethers.JsonRpcProvider("HTTP://127.0.0.1:7545");
provider.getBalance("0x137ff0b988d53Ae911be8B395f0337Ca2d4c8760").then((balance) => {
  console.log("Balance:", balance.toString());
});

// 查询以太坊主网的钱包地址(其他的eth节点服务商提供的，也差不多，如果请求比较频繁，还要收费)
let mainnetProvider = new ethers.EtherscanProvider(undefined, "YM1I95IA1D1KVHCDZCMABYWCCWN4HQF4BM");
mainnetProvider.getBalance("0xF977814e90dA44bFA03b6295A0616a897441aceC").then((res) => {
  console.log("Mainnet Balance:", res);
});

/**
 *  在实际开发过程中，如果一个服务商挂了，还可以获取其他服务商的信息，可以使用fallbackProvider,可以配置优先级和权重。
 * 
 */ 





