// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 定义一个接受接口
interface TokenRecipient {
    function tokensReceived(address from, uint256 amount) external returns (bool);
}

contract MyERC20 is ERC20 {

    // 构造函数
    constructor() ERC20("MyERC20", "MYC"){
        _mint(msg.sender, 100000000 * 10 ** decimals());
    }

    // 拓展增加一个hook函数：类似ERC777的，转账不需要确认
    function transferWithCallBack(address recipient, uint256 amount) external returns (bool) {
        // token的转账：本质是在合约上面给另外一个地址记账（这里是银行合约）
        _transfer(msg.sender, recipient, amount);
        if(_isContract(recipient)){
            // 调用接口的直接导致函数（TokenBankV2实现了该函数）：在银行合约上，给当前发起的钱包记账
            bool rv = TokenRecipient(recipient).tokensReceived(msg.sender, amount);
            require(rv, "No tokensReceived");
        }
        return true;
    }

    // 辅助函数，检查地址是否为合约
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}

