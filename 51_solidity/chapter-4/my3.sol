
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract My3 {

    // 下面是以太坊的常见的三个单位
    uint256 a = 1 ether;
    uint256 b = 10 ** 9 * 1 gwei;
    uint256 c = 10 ** 18 * 1 wei;

    
    // 比较
    function name() public view returns (bool){
        return b == c;
    }

    // 转账的时候，可以限定转账的单位
    function name2(address _addr) public payable {
        // 将转账的地址转为可转账的地址
        address payable ap = payable(_addr);
        require(msg.value == 10 gwei, "must 10 gwei");
        ap.transfer(msg.value);
    }

    function name3(address _addr) public payable {
        address payable ap = payable(_addr);
        require(msg.value == 10 wei, "must 10 wei");
        ap.transfer(msg.value);
    }

    // finney就是0.01 ether
    function name4(address _addr) public payable {
        address payable ap = payable(_addr);
        require(msg.value == 0.01 ether, "must 0.001 ether");
        ap.transfer(msg.value);
    }

}