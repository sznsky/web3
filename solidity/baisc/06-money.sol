// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

//合约-转账
contract money_demo {

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
        //下面的意思是：充值的数量_amount与消息msg携带eth的数量要一致，否则结束请求
        if(_amount != msg.value){
            return;
        }
        //msg可以理解为内置对象（系统函数），通过这个对象可以获取到充值的用户信息（甲乙触发的用户地址）
        user = payable(msg.sender);
        //将充值金额赋值给账面金额
        totalAmount = _amount;
    }

    //查询链上余额函数:注意，这里返回两个返回值，两个参数
    function getBalance() public view returns (uint256, uint256){
        //查询的是当前合约链上的余额，this标识当前合约对象
        //下面的返回值：1.链上余额，2.账目金额
        return (address(this).balance, totalAmount);
    }

    //提现函数
    function withdraw(uint256 _amount) public payable {
        //这里提现函数，提现的是链上的钱，没有做任何账面的处理
        user.transfer(_amount);
        //账目扣减
        totalAmount  = totalAmount - _amount;
    }


    
}

