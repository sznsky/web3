// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

//断言
contract require_demo {

    //合约管理员，地址类型address
    address public admin;

    //充值用户，地址类型adress
    //如果这个地址涉及充值和转账的，需要加上payable
    address payable public user;

    //账面金额：可能和实际拥有的金额不一致
    uint256 totalAmount;

    //合约构造函数
    constructor(address _owner) {
        admin = _owner;
    }

    //充值函数,涉及到金额的变更需要使用关键字payable
    function deposit(uint256 _amount) public payable {
        //断言:这里使用断言,前面是条件，后面是不符合条件的返回值
        require(_amount == msg.value, "amount must == value");
        assert(_amount > 0);
        user = payable(msg.sender);
        totalAmount = _amount;
    }

 
    function getBalance() public view returns (uint256, uint256){
        return (address(this).balance, totalAmount);
    }


    function withdraw(uint256 _amount) public payable {
        user.transfer(_amount);
        totalAmount  = totalAmount - _amount;
    }


    
}

