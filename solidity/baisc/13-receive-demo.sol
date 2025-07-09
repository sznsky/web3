//下面的这行注释是必须要有的
//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

//receive函数：外部资金从用户钱包打过来的时候（打到合约上的时候），需要使用receive函数，也就是接受资金要使用的函数
//fallback函数：如果外部资金打入的过程中，出现问题（也就是合约未正常履行的情况下），就走fallback函数，也就是receive函数的兜底函数
//注意：这两个函数都不能使用functon,因为这两个函数不是合约方法，应该是全局方法
contract receive_demo {

    //合约总金额（合营上的钱）
    uint256 totalAmount;
    //记录打钱过来的合营地址（谁转的钱过来）
    address[] public addrs;

    //接受外部资金函数：这是特殊函数，不需要function
    receive() external payable {
        //将转过来的钱加到总金额上
        totalAmount += msg.value;
        //将发生地址保存起来
        addrs.push(msg.sender);
    }

    //查询总额（我们自己记录的），合营上的余额。正常情况下，这两个是一致的
    function getBalance() public view returns(uint256, uint256){
        return (totalAmount, address(this).balance);
    }
    
}

