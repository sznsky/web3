import { createPublicClient, http, keccak256, pad, toHex, Hex } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({
  chain: sepolia,
  transport: http('http://localhost:8545') // 确保这里是你的 Sepolia 节点 RPC URL
});

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // 替换成你的实际合约地址

// _locks 数组的槽位是 0
const arrayLengthSlot = 0n; // 动态数组的长度存储在声明该数组的槽位

// 动态数组的数据从 keccak256(arrayLengthSlot) 处开始
// 我们需要将 0n 填充为 32 字节的 hex，再计算 keccak256
const arrayDataStartSlot = BigInt(keccak256(pad(toHex(arrayLengthSlot), { size: 32 })));

function parseLockInfo(slot1Val: Hex, slot2Val: Hex) {
    let user: Hex;
    let startTime: bigint;
    let amountValue: bigint;

    // --- 解析第一个槽位 (slot1Val): user (address) 和 startTime (uint64) ---
    // 根据 Solidity 存储打包规则：
    // address (20字节) 和 uint64 (8字节) 会打包到 32 字节槽位。
    // 通常，较小类型会紧随较大类型，或者按照低位优先对齐。
    // 在一个 32 字节的槽位中，user (20字节) 会占据低位，startTime (8字节) 会占据高位，
    // 中间有 4 字节的填充 (32 - 20 - 8 = 4)。
    // 槽位数据 (Hex, 64 chars): [0x][startTime (16 chars)][padding (8 chars)][user (40 chars)]
    // 示例: 0x AAAA AAAA AAAA AAAA BBBB BBBB CCCCCCCCCC...
    //        ^startTime (16 chars) ^padding(8 chars) ^user(40 chars)

    if (slot1Val === '0x' || slot1Val.length !== 66) { // '0x' + 64 chars
        console.warn(`Warning: slot1Val is invalid or empty: ${slot1Val}. Defaulting user/startTime to zero.`);
        user = '0x0000000000000000000000000000000000000000';
        startTime = 0n;
    } else {
        // 用户地址 (address) 是槽位的低 20 字节 (40 个十六进制字符)
        // 对应 hex 字符串的最后 40 个字符
        user = `0x${slot1Val.slice(26, 66)}` as Hex; // slice(26, 66) is (0x + padding + startTime + user), from index 26 to 65.
                                                    // This correctly extracts the last 40 characters.

        // startTime (uint64) 是槽位的高 8 字节 (16 个十六进制字符)
        // 对应 hex 字符串的开头 16 个字符 (不包括 '0x')
        const startTimeHex = slot1Val.slice(2, 18); // slice(2, 18) extracts from index 2 to 17 (16 chars)
        startTime = BigInt(`0x${startTimeHex}`);
    }

    // --- 解析第二个槽位 (slot2Val): amount (uint256) ---
    // uint256 占用完整的 32 字节槽位
    if (slot2Val === '0x' || slot2Val.length !== 66) { // '0x' + 64 chars
        console.warn(`Warning: slot2Val is invalid or empty: ${slot2Val}. Defaulting amount to 0.`);
        amountValue = 0n;
    } else {
        // amount 就是整个槽位的值
        amountValue = BigInt(slot2Val);
    }

    return { user, startTime, amount: amountValue };
}

async function readAllLocks() {
    // 1. 读取数组长度
    const lenHex = await client.getStorageAt({ address: contractAddress, slot: toHex(arrayLengthSlot, { size: 32 }) });

    let length = 0n;
    if (lenHex === undefined || lenHex === '0x') {
        console.warn(`Warning: Could not read length from slot ${arrayLengthSlot} or it's empty ('0x'). Assuming length 0.`);
    } else {
        length = BigInt(lenHex);
    }

    if (length === 0n) {
        console.log("No locks found (length is 0).");
        // 如果构造函数只添加了 11 个锁，并且合约地址正确，那么这里的 length 应该不是 0
        // 如果这里是 0，说明合约没有部署或没有数据写入。
        return;
    }

    console.log(`Found ${length} locks.`);

    // 2. 遍历读取每个 LockInfo 结构体
    for (let i = 0n; i < length; i++) {
        // 每个 LockInfo 占用 2 个槽位
        const slotOffset = i * 2n;

        const slot1Addr = arrayDataStartSlot + slotOffset;
        const slot2Addr = arrayDataStartSlot + slotOffset + 1n;

        // 将槽位地址转换为 Hex 字符串
        const slot1Hex = toHex(slot1Addr, { size: 32 }) as Hex;
        const slot2Hex = toHex(slot2Addr, { size: 32 }) as Hex;

        const [slot1Val, slot2Val] = await Promise.all([
            client.getStorageAt({ address: contractAddress, slot: slot1Hex }),
            client.getStorageAt({ address: contractAddress, slot: slot2Hex }),
        ]);

        // 检查读取到的值是否有效
        if (slot1Val === undefined || slot1Val === '0x' || slot2Val === undefined || slot2Val === '0x') {
            console.warn(`Warning: Could not read complete data for locks[${i}] from slots ${slot1Hex} and ${slot2Hex}. Skipping.`);
            continue;
        }

        const { user, startTime, amount } = parseLockInfo(slot1Val, slot2Val);
        console.log(`locks[${i}]: user: ${user}, startTime: ${startTime}, amount: ${amount}`);
    }
}

readAllLocks().catch(console.error);