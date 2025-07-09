
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract My2 {

    // 获取当前发送人的账户余额
    function name() public view returns (uint256) {
        return msg.sender.balance;
    }

    // 推荐转账用法
    // 转账: 这个转账出现异常，会回滚
    // 接受地址：_abr
    // 转账地址：msg.sender
    // 转账金额：msg.value
    function name2(address _abr) public payable {
        // 将地址转为可以转账的地址
        address payable a = payable (_abr);
        // a是可转账的接受地址，transfer是转为接受地址的
        a.transfer(msg.value);
    }

    // 下面的这个转账不会回滚。
    function name3(address _adr) public payable {
        // 将地址转为可以转账的地址
        address payable a = payable(_adr);
        bool succ = a.send(msg.value);
        require(succ);
    }












    

}