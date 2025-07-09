
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 转账类型
contract My {

    // 这个地址是不可转账地址
    address public a = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;

    // 将上面的地址转为可支付地址(地址还是一样的，但是性质发生了变化)
    function name() public view returns(address payable){
        return payable(a);
    }


    // 把地址转为数字
    // 520786028573371803640530888255888666801131675076
    function name2() public view returns (uint160){
        return uint160(a);
    }

    // 将数字转为地址
    // 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
    function name3(uint160 _a) public pure returns (address){
        return address(_a);
    }

    // 把地址类型转为字节类型
    function name4() public view returns (bytes20) {
        return bytes20(a);
    }

    // 把字节类型转为地址类型
    function name5(bytes20 _a) public pure returns (address) {
        return address(_a);
    }

    // 总结：其实地址类型就是20个字节类型

    







    














    
}