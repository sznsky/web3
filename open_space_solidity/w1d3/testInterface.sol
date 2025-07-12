// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// 定义一个接口
interface IPayable {

    // 注意：接口的方法必须使用关键字external，也就是外部   
    function pay(address recipient, uint256 amount) external; 

    function getBalance() external view returns (uint256);

}

// 该合约实现接口
contract Payable is IPayable {
    // 使用mapping来模拟用户余额
    mapping(address => uint256) private balances;

    // 重写接口方法:这里的override 可以被省略，但是还是添加比较好，说明这个是重写接口的方法
    function pay(address recipient, uint256 amount) override  external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
    }

    // 重写接口方法
    function getBalance() override external view returns (uint256) {
        return balances[msg.sender];
    }

    // 自定义方法
    function add(uint x, uint y) public pure returns (uint){
        return x+y;
    }
}

