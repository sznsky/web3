// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// 简单计数合约
contract Counter {
    uint public counter;

    // 构造方法
    constructor() {
        counter = 0;
    }

    function count() public  {
        counter = counter+1;
    }

    function get() public view returns (uint){
        return counter;
    }

    function add(uint x) public {
        counter = counter + x;
    }

}