// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;
//这个要使用相对路径，才能找得到
import "../chapter-5/Callee.sol";

//发起调用合约
contract Caller {

    //成员变量是地址类型
    address calleeAddress;
    //构造函数：构造这个地址成员
    constructor(address _calleeAddress){
        calleeAddress = _calleeAddress;
    }
    //这个合约调用Callee合营
    function setCalleeX(uint _x) public {
        Callee callee = Callee(calleeAddress);
        callee.setX(_x);
    }
    //0x1c91347f2A44538ce62453BEBd9Aa907C662b4bD
    
}