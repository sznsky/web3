// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; //solidity<=0.8.7 && >=0.6.0



     //这个结构也可以放到合约的外面
    // struct User{
    //     string name;
    //     uint8 age;
    //     string sex;  
    // }


/*
    结构化的合约
*/
contract struct_demo {

    //自定义结构：定义一个User的结构，其实就是和java中一个类的概念【这个】
    struct User{
        string name;
        uint8 age;
        string sex;  
    }

    User user;

    //设置用户属性信息
    function setUser(string memory _name,uint8 _age, string memory _sex) public {
        user.name = _name;
        user.age = _age;
        user.sex = _sex;
    }

    //查询用户信息,注意_name和_sex的类型是string memory,返回值类型也要添加成一样的
    function getUserInfo() public view returns(string memory,uint8,string memory){
        return (user.name,user.age,user.sex);
    }



    
}