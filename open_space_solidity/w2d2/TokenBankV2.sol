// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenBank.sol";

contract TokenBankV2 is TokenBank, TokenRecipient{

    // 构造函数
    constructor(address _tokenAddress) TokenBank(_tokenAddress) {}

    event tokensReceivedLogMessage(string message, address sender, address _from, uint _amount);
    

    // tokensReceived 接受记账函数
    function tokensReceived (address _from, uint _amount) external override returns(bool) {
        emit tokensReceivedLogMessage("TokenBankV2.tokensReceived called", msg.sender,_from, _amount);
        // 该回调函数的发起者必须是合约
        require(_isContract(msg.sender), "The caller must be a contract");
        // 判断金额
        require(_amount > 0, "Deposit amount must be greater than zero");
        balances[_from] += _amount;
        return true;
    }

    // 辅助函数，检查地址是否为合约
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}