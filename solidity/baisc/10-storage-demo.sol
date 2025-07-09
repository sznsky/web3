// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; //solidity<=0.8.7 && >=0.6.0


/*
    storage和memory的区别：
    storage引用传递：会修改数据的本身，也就是会进行数据的持久化
    memory值传递：只是修改数据的副本
*/
contract storage_demo {

    //自定义结构：定义一个User的结构，其实就是和java中一个类的概念【这个】
    struct User{
        string name;
        uint8 age;
        string sex;  
    }

    User public adminUser;

    //设置用户属性信息
    function setUser(string memory _name,uint8 _age, string memory _sex) public {
        adminUser.name = _name;
        adminUser.age = _age;
        adminUser.sex = _sex;
    }
    
    //查询user信息
    function getUser() public view returns (User memory){
        return adminUser;
    }

    //设置年龄
    function setAge1(uint8 _age) public {
        //将adminUser赋值给user对象,使用了memory,这里的user只是adminUser的副本,修改user的值是不会影响adminUser的
        User memory user = adminUser;
        user.age = _age;
    }

    //设置年龄
    function setAge2(uint8 _age) public {
        //将adminUser赋值给user对象，这里使用了storage,那么user就是adminUser的引用，说白了，就是同一个内存地址，指向同一个对象，修改user就是修改adminUser.
        User storage user = adminUser;
        user.age = _age;
    }

    //内部函数：注意参数使用了memory的时候，是不能使用public,public是对外调用函数，存在安全隐患，所以这里只能使用internal
    function setAge3(User storage _user, uint8 _age) internal {
       _user.age = _age;
    }

    //下面的函数,调用函数3
    function setAge4(uint8 _age) public {
        setAge3(adminUser, _age);
    }
    
}