// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a / b;
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


contract BaseERC20 {
    using SafeMath for uint;
    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 public totalSupply; 

    mapping (address => uint256) balances; 

    mapping (address => mapping (address => uint256)) allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // write your code here
        // set name,symbol,decimals,totalSupply
        name = "BaseERC20";
        symbol = "BERC20";
        decimals = 18;
        totalSupply = 100000000 * (10 ** uint256(decimals));
        balances[msg.sender] = totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        // write your code here
        return balances[_owner];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // write your code here

        address owner = msg.sender;
        _transfer(owner, _to, _value);

        emit Transfer(msg.sender, _to, _value);
        return true; 
    }

    /**
     * 有hook功能的转账函数
     */
    function transferWithCallBack(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        if(_isContract(recipient)){
            bool rv = TokenRecipient(recipient).tokensReceived(msg.sender, amount);
            require(rv, "No tokensReceived");
        }
        return true;
    }

    // 辅助函数，检查地址是否为合约
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }


    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // write your code here

        address spender = msg.sender;
        _spendAllowance(_from, spender, _value);
        _transfer(_from, _to, _value);
        
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        // write your code here

        address owner = msg.sender;
        _approve(owner, _spender, _value);

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {   
        // write your code here     
        return allowances[_owner][_spender];
    }

    /**
     * 下面是内部调用方法
     */
    function _approve(address owner, address spender, uint256 value,bool emitEvent) internal virtual {
        require(owner != address(0), "owner address is error");
        require(spender != address(0), "spender address is error");
        allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "from address is error");
        require(to != address(0), "to address is error");
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal virtual{
        require(from != address(0),"from address is error");
        require(to != address(0),"from address is error");
        // 转账金额bix账户余额
        require(balances[from] >= value, "Transfer amount exceeds balance!");
        // from地址扣除
        balances[from] -= value;
        //to地址增加
        balances[to] += value;
    }

    function _spendAllowance(address owner,address spender, uint256 value) internal virtual{
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= value, "Insufficient allowance"); // 添加授权检查
        _approve(owner, spender, currentAllowance - value, false);
    }
}

contract TokenBank{
    // 这个tokenBank只能存入BaseERC20
    BaseERC20 public token;
    // 记录每个地址的token数量
    mapping (address => uint256) public balances;

    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Token address cannot be zero");
        token = BaseERC20(_tokenAddress);
    }

    // 存入token
    function deposit(uint _amount) public {
        require(_amount > 0, "Deposit amount must be greater than zero");
        bool suncess = token.transferFrom(msg.sender, address(this), _amount);
        require(suncess, "Token transfer failed (check allowance)");
        balances[msg.sender] += _amount;
    }

    /**
     * 从银行取出token
     */
    function withdraw(uint256 _amount) public payable {
        require(_amount > 0, "Withdraw amount must be greater than zero !");
        require(balances[msg.sender] > _amount, "Insufficient balance in bank");
        // 更新用户存款余额
        balances[msg.sender] -= _amount;
        // 将token 从本合约转回调用者地址
        bool success = token.transfer(msg.sender, _amount);
        require(success, "Token transfer failed");
    }

    /**
     * 查询银行存款余额（自测使用）
     * @param _user address 用户地址
    */ 
    function getBalance(address _user) public view returns (uint256){
        return balances[_user];
    }
}

interface TokenRecipient {
    function tokensReceived(address from, uint256 amount) external returns (bool);
}

contract TokenBankV2 is TokenBank, TokenRecipient{

    // 无参数的构造函数
    constructor(address _tokenAddress) TokenBank(_tokenAddress) {}

    // tokensReceived 接受记账函数
    function tokensReceived (address _from, uint _amount) external override returns(bool) {
        // 回调函数必须是合约地址
        require(msg.sender == address(_from), "Not the valid address!");
        require(_amount > 0, "Deposit amount must be greater than zero");
        balances[_from] += _amount;
        return true;
    }
}