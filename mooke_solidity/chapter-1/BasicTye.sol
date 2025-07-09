
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2  <0.9.0;

contract BasicType{

    //基本类型的测试
    function testInt() public pure returns(uint){
        uint256 i8 = 259887;

        //这是一个很大的值：115792089237316195423570985008687907853269984665640564039457584007913129639935
        uint256 max = type(uint256).max;

        uint8 x = 8;
        uint16 y = 9;
        y = x;
       //这样不行：不能大的赋值给小的类型 x = y,如果真的要赋值，可以转换一下
       x = uint8(y);
        return max;
    }

    //枚举类型
    enum OrderState{
        layorder, payment
    }
    function enumTest()public view returns(OrderState){
        OrderState state = OrderState.payment;
        return state;
    }

}