
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// 引入 OpenZeppelin 的接口和工具类
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";       // ERC20 基础接口
import "@openzeppelin/contracts/access/Ownable.sol";           // 管理员权限控制
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // 防重入攻击

/**
 * @title KK Token 
 * @dev KK Token 接口，继承 ERC20，增加 mint 方法（允许合约铸造新币）
 */
interface IToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title Staking Interface
 * @dev 规定质押池必须实现的函数
 */
interface IStaking {
    function stake() payable external;                        // 质押 ETH
    function unstake(uint256 amount) external;                // 赎回 ETH
    function claim() external;                                // 领取 KK Token 奖励
    function balanceOf(address account) external view returns (uint256); // 查询质押余额
    function earned(address account) external view returns (uint256);    // 查询未领取奖励
}

/**
 * @dev 借贷市场接口（示例），实际接入时换成真实协议
 */
interface ILendingMarket {
    function deposit() external payable;     // 存 ETH
    function withdraw(uint256 amount) external; // 取 ETH
}

contract StakingPool is IStaking, Ownable, ReentrancyGuard {
    IToken public immutable kkToken; // KK Token 合约地址

    uint256 public constant KK_PER_BLOCK = 10 * 1e18; // 每个区块产 10 个 KK（18位小数）

    uint256 public totalSupply; // 总质押的 ETH 数量（单位：wei）
    mapping(address => uint256) private _balances; // 用户 -> 质押数量

    uint256 public rewardPerTokenStored; // 全局累计的“每质押1 ETH可获得多少奖励”的数值
    uint256 public lastUpdateBlock;      // 上一次更新奖励的区块号

    mapping(address => uint256) public userRewardPerTokenPaid; // 用户上次结算时的 rewardPerTokenStored
    mapping(address => uint256) public rewards; // 用户累计未领取的奖励

    ILendingMarket public lendingMarket; // 借贷市场地址
    bool public useLendingMarket;        // 是否启用借贷市场

    // 一些事件，用于链上记录
    event Staked(address indexed user, uint256 amount);      // 质押事件
    event Unstaked(address indexed user, uint256 amount);    // 赎回事件
    event RewardPaid(address indexed user, uint256 reward);  // 发放奖励事件
    event LendingMarketSet(address indexed market, bool enabled); // 设置借贷市场事件

    constructor(address _kkToken) Ownable(msg.sender){
        require(_kkToken != address(0), "KK token zero"); // 确保 KK Token 地址不为 0
        kkToken = IToken(_kkToken);
        lastUpdateBlock = block.number; // 初始化时记录当前区块号
    }

    // 计算奖励前先更新全局和用户的奖励状态
    modifier updateReward(address account) {
        _updateRewardPerToken(); // 更新全局 rewardPerTokenStored
        if (account != address(0)) {
            rewards[account] = earned(account);                // 结算用户已获得但未领取的奖励
            userRewardPerTokenPaid[account] = rewardPerTokenStored; // 更新用户的结算基准值
        }
        _;
    }

    /**
     * @dev 更新全局的 rewardPerTokenStored
     * 大白话：计算从上次更新到现在的区块，新增的奖励，并分摊到每个质押的 ETH 上
     */
    function _updateRewardPerToken() internal {
        if (block.number == lastUpdateBlock) return; // 如果区块没变，就不更新
        if (totalSupply > 0) {
            uint256 blocksElapsed = block.number - lastUpdateBlock; // 经过多少个区块
            // 这里额外乘以1e18，是最终存储的是wei这个单位。也就是最小单位
            rewardPerTokenStored += (blocksElapsed * KK_PER_BLOCK * 1e18) / totalSupply;
            // ↑ 新增奖励 = 区块数 * 每区块奖励 * 精度系数 / 总质押
        }
        lastUpdateBlock = block.number; // 更新最后结算的区块号
    }

    /**
     * @dev 计算某个用户当前应得的奖励
     * 大白话：已累积的奖励 + 从上次更新到现在的新增奖励
     */
    function earned(address account) public view override returns (uint256) {
        uint256 rpt = rewardPerTokenStored;
        if (block.number > lastUpdateBlock && totalSupply > 0) {
            rpt += ((block.number - lastUpdateBlock) * KK_PER_BLOCK * 1e18) / totalSupply;
        }
        // 这里除以1e18，是因为前面两个参数_balances[account]和(rpt - userRewardPerTokenPaid[account])都是wei为单位的
        // 必须除以1e18才是正常的wei为单位的
        return rewards[account] + (_balances[account] * (rpt - userRewardPerTokenPaid[account]) / 1e18);
    }

    /**
     * @dev 查询用户质押了多少 ETH
     */
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev 质押 ETH
     * 大白话：
     * 1. 先更新奖励（防止旧数据干扰）updateReward
     * 2. 增加用户质押余额
     * 3. 如果开启借贷市场，把 ETH 存进去
     */
    function stake() external payable override nonReentrant updateReward(msg.sender) {
        require(msg.value > 0, "Cannot stake 0");
        // 增加用户质押余额
        _balances[msg.sender] += msg.value;
        // 增加质押总量
        totalSupply += msg.value;

        if (useLendingMarket) {
            // 存入借贷市场：放贷
            lendingMarket.deposit{value: msg.value}();
        }

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev 赎回 ETH：下面是简单的赎回流程，真正的质押赎回，是要计算复利的。
     * 大白话：
     * 1. 检查余额是否足够
     * 2. 更新奖励 updateReward
     * 3. 减少用户质押
     * 4. 如果有借贷市场，从借贷市场取 ETH
     * 5. 把 ETH 转给用户
     */
    function unstake(uint256 amount) external override nonReentrant updateReward(msg.sender) {
        // 赎回的金额必须大于0
        require(amount > 0, "Unstake 0");
        // 赎回的金额必须大于存入的金额
        require(_balances[msg.sender] >= amount, "Insufficient staked");
        // 用户资产-赎回金额
        _balances[msg.sender] -= amount;
        // 质押总额-赎回余额
        totalSupply -= amount;

        if (useLendingMarket) {
            lendingMarket.withdraw(amount); // 从借贷市场取回
        }
        // 转入用户账户
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "ETH transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev 提取奖励（KK Token）
     * 大白话：
     * 1. 更新奖励数据
     * 2. 清零用户奖励
     * 3. 铸造 KK Token 给用户
     */
    function claim() external override nonReentrant updateReward(msg.sender) {
        // 记录用户的奖励
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            // 提出奖励，置为0
            rewards[msg.sender] = 0;
            // 铸造kk，并发放到用户地址
            kkToken.mint(msg.sender, reward); // 给用户发 KK Token
            emit RewardPaid(msg.sender, reward);
        }
    }

    /**
     * @dev 设置借贷市场地址，控制是否开启：只有管理员才能决定是否开启或者关闭
     */
    function setLendingMarket(address market, bool enabled) external onlyOwner {
        if (enabled) {
            require(market != address(0), "market zero");
            lendingMarket = ILendingMarket(market);
            useLendingMarket = true;
        } else {
            useLendingMarket = false;
            lendingMarket = ILendingMarket(address(0));
        }
        emit LendingMarketSet(market, enabled);
    }

    // 接收 ETH
    receive() external payable {}
}



