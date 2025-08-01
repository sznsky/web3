// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BankWithLinkedList {

    // 记录所有用户存款总额的映射
    mapping(address => uint256) public balances;

    // --- 可迭代链表实现 (Top 10) ---

    // 链表节点结构
    struct Node {
        address user;
        uint256 amount;
        address next;
        address prev;
    }

    // 存储链表节点的映射，以用户地址为键
    mapping(address => Node) private linkedListNodes;
    address private head; // 链表头节点地址
    address private tail; // 链表尾节点地址
    uint256 private linkedListLength;

    // 数组元素结构，用于 view 函数返回数据
    struct UserScore {
        address user;
        uint256 amount;
    }

    event Deposit(address indexed user, uint256 amount, uint256 newBalance);

    // --- 存款函数：核心业务逻辑 ---

    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");

        uint256 newBalance = balances[msg.sender] + msg.value;
        balances[msg.sender] = newBalance;

        // 更新链表
        _updateLinkedList(msg.sender, newBalance);

        emit Deposit(msg.sender, msg.value, newBalance);
    }

    // --- 内部函数：维护链表 ---

    // 负责更新链表的逻辑，是整个合约 Gas 优化的核心
    function _updateLinkedList(address _user, uint256 _amount) private {
        // 如果用户已在链表中
        if (linkedListNodes[_user].amount > 0) {
            // 如果存款金额不变，无需操作
            if (linkedListNodes[_user].amount == _amount) {
                return;
            }
            // 更新金额，并重新定位
            _removeNode(_user);
            _insertNode(_user, _amount);
        } else { // 用户不在链表中
            // 如果链表未满，直接插入
            if (linkedListLength < 10) {
                _insertNode(_user, _amount);
            } else {
                // 链表已满，如果新金额大于尾部金额，则移除尾部并插入新节点
                if (_amount > linkedListNodes[tail].amount) {
                    _removeNode(tail);
                    _insertNode(_user, _amount);
                }
            }
        }
    }

    // 插入新节点到链表中正确的位置
    function _insertNode(address _user, uint256 _amount) private {
        linkedListNodes[_user] = Node({user: _user, amount: _amount, next: address(0), prev: address(0)});
        linkedListLength++;

        address currentNodeAddress = head;
        address prevNodeAddress = address(0);

        while (currentNodeAddress != address(0) && linkedListNodes[currentNodeAddress].amount > _amount) {
            prevNodeAddress = currentNodeAddress;
            currentNodeAddress = linkedListNodes[currentNodeAddress].next;
        }

        // 插入到头部
        if (prevNodeAddress == address(0)) {
            linkedListNodes[_user].next = head;
            if (head != address(0)) {
                linkedListNodes[head].prev = _user;
            } else {
                tail = _user;
            }
            head = _user;
        } else { // 插入到中间或尾部
            linkedListNodes[_user].next = currentNodeAddress;
            linkedListNodes[_user].prev = prevNodeAddress;
            linkedListNodes[prevNodeAddress].next = _user;
            if (currentNodeAddress != address(0)) {
                linkedListNodes[currentNodeAddress].prev = _user;
            } else {
                tail = _user;
            }
        }
    }

    // 从链表中移除一个节点
    function _removeNode(address _user) private {
        Node storage nodeToRemove = linkedListNodes[_user];

        if (nodeToRemove.prev != address(0)) {
            linkedListNodes[nodeToRemove.prev].next = nodeToRemove.next;
        } else {
            head = nodeToRemove.next;
        }

        if (nodeToRemove.next != address(0)) {
            linkedListNodes[nodeToRemove.next].prev = nodeToRemove.prev;
        } else {
            tail = nodeToRemove.prev;
        }

        delete linkedListNodes[_user];
        linkedListLength--;
    }

    // --- 只读函数：获取数据 ---

    // 获取链表的前10名用户 (view函数)
    function getTop10LinkedList() public view returns (UserScore[] memory) {
        UserScore[] memory result = new UserScore[](linkedListLength);
        address currentNodeAddress = head;
        for (uint i = 0; i < linkedListLength; i++) {
            result[i] = UserScore({user: linkedListNodes[currentNodeAddress].user, amount: linkedListNodes[currentNodeAddress].amount});
            currentNodeAddress = linkedListNodes[currentNodeAddress].next;
        }
        return result;
    }
}