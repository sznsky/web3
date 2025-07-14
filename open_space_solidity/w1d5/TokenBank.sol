// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TokenBank {

    mapping (address => uint256) public balanceOf;

    receive() external payable { 
        balanceOf[msg.sender] += msg.value;
    }

    // 存入token
    function deposit(address _addr, uint _amount) public payable {
        balanceOf[_addr] += _amount;
    }

    // 提现token
    function withdraw(address _youint _amount) public payable {
        require(balanceOf[msg.sender] >= _amount, "Not Enough Balance!");
    }
}



