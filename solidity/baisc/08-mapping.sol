// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; //solidity<=0.8.7 && >=0.6.0
/*
映射关系
*/
contract mapping_demo {

    //声明一个映射关系maths(数学成绩)
    mapping(string=>uint256) maths;

    //给上面的成员变量maths变量赋值，增加分数
    function addStore(string memory _name,uint256 _score) public {
        if(maths[_name] > 0){
            return;
        }
        maths[_name] = _score;
    }

    //查询分数,由于没有修改数据，故使用view关键字
    function getStore(string memory _name) public view returns(uint256) {
        return maths[_name];
    }


    
}