// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

//被调用合约
contract Callee {
    //成员变量x
    uint public x;
    //给成员变量赋值
    function setX(uint _x) public {
        x = _x;
    }
    //0x4a9C121080f6D9250Fc0143f41B595fD172E31bf
}