// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// This is the main building block for smart contracts.
contract Message {

    // Some string type variables to identify the token.
    string public name = "My Blockchain Message";
    string public symbol = "MBM";

    event MessageSet(address account, string content);

    // 固定发行量
    // uint256 public totalSupply = 1000000;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    // A mapping is a key/value map. Here we store each account balance.
    mapping(address => string) messages;

    /**
     * 合约构造函数
     *
     * The `constructor` is executed only once when the contract is created.
     * The `public` modifier makes a function callable from outside the contract.
     */
    constructor() public {
        // The totalSupply is assigned to transaction sender, which is the account
        // that is deploying the contract.
        // balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    /**
     * 写入留言
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function write_message(string memory textmsg) external {
        messages[msg.sender] = textmsg;
        emit MessageSet(msg.sender, textmsg);
    }


    /**
     * 读取某账号的留言信息
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function read_message(address account) external view returns (string memory) {
        // require(balances[msg.sender] != undefined, "no message");
        return messages[account];
    }


}
