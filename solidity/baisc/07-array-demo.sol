// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; //solidity<=0.8.7 && >=0.6.0

/*

数组
 names:["zhangsan","lisi","sunzhenning"]
 ages:[20,30,40]
*/

contract array_demo {
    //静态数组(定长数组)，制定数组长度
    string[5] public names;
    //动态数组
    uint8[] public ages; 

    //构造函数
    constructor() {
        //注意字符串类型，这里不能赋值中文
        names[0] = "zhangsan";
        names[1] = "lisi";
        names[2] = "sunzhenning";

        ages.push(20);

        //注意：动态数组不能直接赋值
        //ages = 10;

        //注意：静态数组不能直接push
        //names.push("lilei");
    }

    //增加年龄
    function addAge(uint8 _age) public{
        ages.push(_age);
    }

    //对于定长数组，是不允许push元素的
    // function addName(string memory _name) public {
    //     names.push(_name);
    // }

    //但是可以通过小标赋值
    function addName(string memory _name) public {
        names[3] = _name;
    }

    //获取数组长度
    function getLength() public view returns(uint256, uint256){
        return (names.length, ages.length);
    }

}

