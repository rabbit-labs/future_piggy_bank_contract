// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

// This is the main building block for smart contracts.
contract FutureMessage is ERC721, Ownable {

    /*
        定义每一个消息的类型，包含了存储的人，content内容，amount附言金额，end_time到期时间
    */
    struct FutureMsg {
        // address account;
        string content;
        uint256 amount;
        uint32 endTime;
        bool isWithdrawed;
    }

    ///定义了每个token对应的msg信息
    mapping(uint => FutureMsg) public fmsgs;

    ///消息被存储的event
    event MessageSet(address account, string content , uint amount , uint end_time);

    uint mintPrice;
    uint maxSupply;

    string _currentBaseURI = "https://futureme.io/token/";

    /**
     * 合约构造函数
     */
    constructor() ERC721("Future Message", "FM"){
        mintPrice = 0.03 ether;
        maxSupply = 100000;
    }

    function mint(address minter,uint256 tokenId,uint32 endTime,string memory content) external payable returns (uint256){
        
        require(minter != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        require(msg.value >= mintPrice, "FM: Insufficient value");
        require(tokenId > 0, "FM: token_id could not be 0");
        require(tokenId <= maxSupply, "FM: token_id must less then max_supply");

        // 为了测试取款，因此在测试取款时候需要注释掉最低时间要求
        // require(block.timestamp <= (endTime - 31536000 + 3600), "FM: timestamp must large then 1 year"); 

        require(block.timestamp >= (endTime - 315360000 + 3600), "FM: timestamp must less then 10 year");

        uint256 saveAmount = msg.value - mintPrice;

        //手续费转账给owner
        payable(owner()).transfer(mintPrice);

        _mint(minter, tokenId);

        //把额外字段写入合约
        FutureMsg storage fmsg = fmsgs[tokenId];
        fmsg.content = content;
        fmsg.endTime = endTime;
        fmsg.amount = saveAmount;
        fmsg.isWithdrawed = false;

        return tokenId;

    }

    function withdrawal(address payable addr,uint256 tokenId) external returns (bool){
        //判断是不是owner
        require(ERC721.ownerOf(tokenId) == addr, "ERC721: transfer from incorrect owner");

        //判断token是否到期
        FutureMsg storage fmsg = fmsgs[tokenId];
        require(fmsg.endTime <= block.timestamp,"FM: the withdrawal time must be greater than the allowable withdrawal time");
       
        //判断是否取款了
        require(fmsg.isWithdrawed == false, "FM: this token is been withdrawed yet");

        //设置状态为已经取款
        fmsg.isWithdrawed = true;

        //取款
        // console.log("Trying to transfer %s tokens to %s", fmsg.amount, addr);
        addr.transfer(fmsg.amount);

        //完成
        return true;
    }

    /**
     * 读取某token的内部信息
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function readMsg(uint256 tokenId) external view returns (FutureMsg memory) {
        require(_exists(tokenId), "ERC721: token is not exist");
        return fmsgs[tokenId];
    }


    function _baseURI() internal view override returns (string memory) {
        return _currentBaseURI;
    }


}

