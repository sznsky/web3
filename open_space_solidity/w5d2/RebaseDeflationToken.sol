// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Rebase 型通缩 ERC20
/// @notice 基于 OpenZeppelin ERC20，实现每年通缩 1%
contract RebaseDeflationToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 1e18; // 初始总量
    uint256 public lastRebaseTime;       // 上次 rebase 时间
    uint256 public scalingFactor;        // 缩放系数，1e18 表示 100%

    mapping(address => uint256) private _rawBalances; // 原始余额
    uint256 private _rawTotalSupply;                  // 原始总量

    event LogRebase(uint256 yearsElapsed, uint256 newScalingFactor);

    constructor() 
        ERC20("Rebase Deflation Token", "RDT") 
        Ownable(msg.sender) 
    {
        scalingFactor = 1e18; // 初始比例 100%
        lastRebaseTime = block.timestamp;

        _rawTotalSupply = INITIAL_SUPPLY;
        _rawBalances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
    }

    /// @dev 返回通缩后的总供应量
    function totalSupply() public view override returns (uint256) {
        return (_rawTotalSupply * scalingFactor) / 1e18;
    }

    /// @dev 返回通缩后的余额：通缩后的余额，是实时计算的，不是事先存好的
    function balanceOf(address account) public view override returns (uint256) {
        return (_rawBalances[account] * scalingFactor) / 1e18;
    }

    /// @notice 每满一年，缩放系数减少 1%
    function rebase() external returns (uint256 newScalingFactor) {
        uint256 elapsed = block.timestamp - lastRebaseTime;
        if (elapsed < 365 days) {
            return scalingFactor; // 不满一年，不变
        }
        // 计算过了几年
        uint256 yearsElapsed = elapsed / 365 days;
        for (uint256 i = 0; i < yearsElapsed; i++) {
            scalingFactor = (scalingFactor * 99) / 100; // 每年减少 1%
        }

        lastRebaseTime += yearsElapsed * 365 days;
        emit LogRebase(yearsElapsed, scalingFactor);
        return scalingFactor;
    }

    /// @dev 转账逻辑（外部接口覆盖）
    function transfer(address to, uint256 amount) public override returns (bool) {
        _transferWithScaling(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transferWithScaling(from, to, amount);
        return true;
    }

    // 转账具体的实现类：将通缩以后的转账转为原始金额，进行转账
    function _transferWithScaling(address from, address to, uint256 amount) internal {
        require(to != address(0), "ERC20: transfer to zero");

        // 计算原始转账金额
        uint256 rawAmount = (amount * 1e18) / scalingFactor;
        require(_rawBalances[from] >= rawAmount, "ERC20: transfer amount exceeds balance");
        // 值的范围已经被检查过，可以使用unchecked减少gas费
        unchecked {
            _rawBalances[from] -= rawAmount;
            _rawBalances[to] += rawAmount;
        }
        emit Transfer(from, to, amount);
    }
}
