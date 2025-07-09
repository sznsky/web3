//下面的这行注释是必须要有的
//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

//自定义修饰语：modifier
contract modifier_demo {
    address public admin;
    uint256 public amount;

    //构造函数
    constructor(){
        admin = msg.sender;
        amount = 101;
    }

    //自定义修饰语onlyadmin,下面是这个修饰语的实现的逻辑
    modifier onlyadmin(){
        require(msg.sender == admin, "only admin can do");
        //amount大于100满足条件，那么给amount初始值的时候，务必要大于100
        require(amount > 100, "amount must > 100");
        _;
    }
    
    //该方法是修改函数，合约的权限就只能是管理员了，使用自定义修饰符能够有效的简化开发，避免一个方法里面写入太多的条件
    function setCount(uint256 _amount) public onlyadmin{
        amount = _amount;
    }
}




