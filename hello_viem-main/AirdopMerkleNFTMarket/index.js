import { createWalletClient, http, publicActions, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains"; // or your target chain
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

// --- 1. 配置 ---
const transport = http("http://127.0.0.1:8545"); // Anvil or other local node
const client = createWalletClient({ chain: mainnet, transport }).extend(publicActions);

// 替换为你的私钥和合约地址
const whitelistedAccount = privateKeyToAccount("0x..."); // 你的白名单账户私钥
const marketContractAddress = "0x..."; // 部署后的市场合约地址
const tokenContractAddress = "0x...";  // 部署后的 Token 合约地址

// 合约 ABI (从 Foundry 的 out 目录中复制)
const marketAbi = [/* ... market ABI ... */];
const tokenAbi = [/* ... token ABI ... */];

async function main() {
    console.log("🚀 Starting Airdrop NFT Claim Process...");

    // --- 2. 构建 Merkle 树 ---
    const whitelistAddresses = [
        whitelistedAccount.address,
        "0x0000000000000000000000000000000000000001", // 其他白名单地址
    ];
    const leaves = whitelistAddresses.map(addr => keccak256(addr));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getRoot();
    const proof = tree.getProof(keccak256(whitelistedAccount.address));
    const hexProof = tree.getHexProof(keccak256(whitelistedAccount.address));

    console.log("🌳 Merkle Root:", `0x${root.toString('hex')}`);
    console.log("🧾 Merkle Proof for your address:", hexProof);

    // --- 3. 准备 `permit` 签名 ---
    const tokenIdToBuy = 0;
    const listingPrice = 100n * 10n**18n; // 假设价格为 100 tokens
    const discountedPrice = listingPrice / 2n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1小时后过期

    const domain = {
        name: await client.readContract({ address: tokenContractAddress, abi: tokenAbi, functionName: 'name' }),
        version: '1',
        chainId: await client.getChainId(),
        verifyingContract: tokenContractAddress,
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
    
    const nonce = await client.readContract({ address: tokenContractAddress, abi: tokenAbi, functionName: 'nonces', args: [whitelistedAccount.address] });

    const signature = await client.signTypedData({
        account: whitelistedAccount,
        domain,
        types,
        primaryType: 'Permit',
        message: {
            owner: whitelistedAccount.address,
            spender: marketContractAddress,
            value: discountedPrice,
            nonce: nonce,
            deadline,
        },
    });

    console.log("✍️ Generated Permit Signature:", signature);
    const { v, r, s } = signature; // Viem v2 returns the full signature string. You need to split it.

    // --- 4. 构造 `multicall` ---
    const permitPrePayData = encodeFunctionData({
        abi: marketAbi,
        functionName: 'permitPrePay',
        args: [whitelistedAccount.address, marketContractAddress, discountedPrice, deadline, v, r, s],
    });

    const claimNFTData = encodeFunctionData({
        abi: marketAbi,
        functionName: 'claimNFT',
        args: [BigInt(tokenIdToBuy), hexProof],
    });

    console.log("📞 Preparing multicall transaction...");
    try {
        const { request } = await client.simulateContract({
            account: whitelistedAccount,
            address: marketContractAddress,
            abi: marketAbi,
            functionName: 'multicall',
            args: [[permitPrePayData, claimNFTData]],
        });

        const hash = await client.writeContract(request);
        console.log("✅ Multicall transaction sent! Hash:", hash);

        const receipt = await client.waitForTransactionReceipt({ hash });
        console.log("🎉 Transaction successful! Receipt:", receipt);
    } catch (error) {
        console.error("❌ Transaction failed:", error);
    }
}

main();