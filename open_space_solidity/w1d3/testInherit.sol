// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// 父合约
contract SuperContract {
    function add(uint x, uint y) public pure returns (uint) {
        return x+y;
    }
}

// 子合约-继承
contract MyContract is SuperContract{
    
}

