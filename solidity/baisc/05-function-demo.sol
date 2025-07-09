// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
/**合约*/
contract func_demo2 {

    uint256 count;

    //构造函数
    constructor(uint256 _c) {
        count = _c;
    }
    //参数是_c,类型是uint256,访问修饰符是public
    function setCount(uint256 _c) public {
        count = _c;
    }
    //无参数，返回参数类型是uint256,访问修饰符是external 
    function getCount() external view returns (uint256){
        return count;
    }
    //充值会更改余额，所以要使用payable
    function deposit() external payable {
    }

    //部署以后，会看见三种颜色的函

    
}