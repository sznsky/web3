
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2  <0.9.0;

contract ContractStructure{

    uint256 public balance;

    //构造函数
    constructor(uint256 _bal){
        balance = _bal;
    }

    //事件,有点相当于java中的日志.记录重要操作
    event BalanceAdded(uint256 oldValue, uint256 incre);

    //函数修饰器：是对函数的输入和输出条件进行约束的,和面向对象中，切面的概念相似
    modifier IncrementRange(uint256 _incre){
        require(_incre > 100, "too small");
         
        _;//执行被修饰函数的逻辑使用下划线_结束
    }


    function balance1() internal view returns(uint256){
        return balance;
    }


    //如果函数没有view和pure,那么这个函数所有的操作，就会被广播到所有的节点
    function addBalance(uint256 _incre) public IncrementRange(_incre){
        uint256 old = balance;
        balance += _incre;
        emit BalanceAdded(old, _incre);
    }
}

