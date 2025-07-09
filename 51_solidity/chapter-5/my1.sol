

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract My {
    
    
    //地址类型变量，这个地址是不能直接转账的
    address public a = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;

    //使用了payable修饰的address以后的地址是能够转账的:可转账地址
    function name() public view returns(address payable) {
        return payable (a);
    }

    //地址可以转为数字，20个字节，1个字节由8位组成，也就是可以使用uint160表示
    //a地址表示为:520786028573371803640530888255888666801131675076
    function name1() public view returns(uint160)  {
        return uint160(a);
    }

    //将20个字节的数字转为地址
    function name2(uint160 _a) public pure returns(address){
        return address(_a);
    }

    





















}
