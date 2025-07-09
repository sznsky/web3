// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2  <0.9.0;

//复杂值类型的合约
contract ComplexValueType {

    //外部地址（发送者的地址）
    function testAddress() public view returns(address) {
        address addr = msg.sender;
        return addr; 
    }
    //0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
    //0x5B38Da6a701c568545dCfcB03FcB875f56beddC4

    //本合营的地址
    function testMyAdddress() public view returns (address){
        address addr = address(this);
        return addr;
    }
    // 0x9d83e140330758a8fFD07F8Bd73e86ebcA8a5692
    //0x9d83e140330758a8fFD07F8Bd73e86ebcA8a5692

    //合约也是一种数据类型
    function testContract() public view {
        //this就是当前合营
        ComplexValueType myContract = this;
    }

    //定义一个3个字节的数组，并返回,默认是：0x000000
    function testFixedByteArray() public pure returns(bytes3){
        //赋值0x110000
        bytes3 data = 0x110000;
        return data;
    }

    function testFixedByteArray1() public pure returns(bytes1){
        //赋值0x110000
        bytes3 data = 0x111111;
        bytes1 first = data[0];
        //uint256 l = data.length;
        return first;
    }














    
}
