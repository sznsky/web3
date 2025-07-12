// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


// 在合约顶部声明自定义错误
error InsufficientBalance(uint current, uint required);
error Unauthorized(string message);


// 接口
interface IBank {

    // 提现
    function withdraw(uint amount) payable external;
    
}

contract Bank is IBank{

    // 合约管理员地址
    address payable public owner;

    // 记录用户账户余额
    mapping(address => uint) public balance_map;

    // 数组: 记录存钱金额前三的用户地址和余额
    address[3] public top3Address;
    uint[3] public top3Balance;

    constructor() {
        owner = payable(msg.sender);
    }

    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    event adminWithdrawMessage(string message, uint256 value, address sender, address owner);
    
    // 存款
    receive() external payable virtual  {
        balance_map[msg.sender] += msg.value;
        // 更新前三用户
        updateTop3Account(msg.sender, balance_map[msg.sender]);
    }


    // 提现
    function withdraw(uint amount) public payable override {
        emit adminWithdrawMessage("withdraw", amount,msg.sender,owner);
        // 检查权限
        require(msg.sender == owner, "Not an owner");
        // 判断余额是否足够，否则回滚交易
        if (address(this).balance < amount){
            revert InsufficientBalance(address(this).balance, amount);
        }
        // call转账
        (bool sucess, ) = owner.call{value:amount}("");
        require(sucess, "Transfer failed");
    }

    // 更新前三用户
    function updateTop3Account(address account, uint balance) private {
        // 遍历余额数组
        for(uint i=0;i<top3Balance.length;i++){
            if (balance > top3Balance[i]) {
                // 将当前位置及后面的元素向后移动一位
                for (uint j = top3Balance.length - 1; j > i; j--) {
                    top3Balance[j] = top3Balance[j - 1];
                    top3Address[j] = top3Address[j - 1];
                }
                // 插入新的账户和余额
                top3Balance[i] = balance;
                top3Address[i] = account;
                break;
            }
        }
    }
}


contract BigBank is Bank{
    
    // 修改器
    modifier checkAmount(uint amount) {
        require(amount > 0.001 ether, "The deposit amount must be greater than 0.001 ether.");
        _;
    }

    // 重写存款方法，增加修改器
    receive() external payable checkAmount(msg.value) override  {
        balance_map[msg.sender] += msg.value;
    }

    // 转移合约管理员
    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "Not an owner");
        require(newOwner != address(0), "New owner cannot be the zero address.");
        require(newOwner != owner, "New owner is already the current owner.");
        emit OwnershipTransferred(owner, newOwner);
        owner = payable(newOwner);
    }
}


contract Admin {

    // admin的owner
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    event adminWithdrawMessage(string message, uint256 value, address contractAddress, address sender);

    modifier checkOwner() {
        require(msg.sender == owner, "Not an owner");
        _;
    }

    // 接受函数
    receive() external payable {}

    // 提现到Admin的合约地址，注意：contractAddress是BigBank的合约地址
    function adminWithdraw(uint amount, address contractAddress) checkOwner public {
        // 调用IBank接口的提现方法，最终实现是BigBank的withdraw
        try IBank(contractAddress).withdraw(amount){
            emit adminWithdrawMessage("adminWithdraw success", amount, contractAddress, msg.sender);
        }catch {
             emit adminWithdrawMessage("adminWithdraw failed", amount, contractAddress, msg.sender);
        }
    }
}
