// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract TestAbtract {

    // 这是个抽象方法，子类必须要实现
    function abstractFunc(uint x) public virtual;
    
    // 这是个常规方法，子类直接继承
    function add(uint x, uint y) pure public returns (uint) {
        return x + y;
    }

    // 这是个常规方法 -子类也是继承的， 但是加了virtual关键字，子类可以重写
    function add1(uint x, uint y) pure public virtual returns (uint) {
        return x + y;
    }
}

// 继承抽象类
contract MyConcreteContract is TestAbtract {
    
    // 实现抽象方法
    function abstractFunc(uint x) public virtual override{
        
    }
    
}