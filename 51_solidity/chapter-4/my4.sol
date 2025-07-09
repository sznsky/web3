
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract My4 {

    // 获取账户余额
    function name(address _addr) public view returns (uint256){
        return _addr.balance;
    }


    // 批量转账
    function name() public payable{
        require(msg.value == 5 ether, "yue bu zu");
        address[5] memory addrs;
        addrs[0] = 0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c;
        addrs[1] = 0x583031D1113aD414F02576BD6afaBfb302140225;
        addrs[2] = 0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB;
        addrs[3] = 0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C;
        addrs[4] = 0xdD870fA1b7C4700F2BD7f44238821C26f7392148;
        for (uint256 i = 0; i< addrs.length;i++){
            address payable a = payable (addrs[i]);
            a.transfer(1 ether);
        }
    }






}