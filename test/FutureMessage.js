
// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const getUnxtimeNow = () => {
    return Math.floor(Date.now() / 1000);
}

const getBalance = async (add) => {
    return await ethers.provider.getBalance(await add.getAddress());
}

const delay = async(time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}
  
  

describe("FutureMessage contract", function () {


  let MessageContract;
  let messageContractInterface;
  let owner;
  let addr1;
  let addr2;
  let addrs;


  beforeEach(async function () {

    MessageContract = await ethers.getContractFactory("FutureMessage");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    messageContractInterface = await MessageContract.deploy();
    await messageContractInterface.deployed();

  });

  describe("测试部署message合约", function () {

    it("owner测试", async function () {
        expect(await messageContractInterface.owner()).to.equal(await owner.getAddress());
    });

  });

  

  describe("测试mintToken", function () {

    it("测试mint一个token并附上一定的eth", async function () {

        let token_id;
        let endtime;
        let ret;

        const provider = ethers.getDefaultProvider();

        let ownerOldBalance = await getBalance(owner);
        // console.log('ownerOldBalance',ownerOldBalance.toString())

        ///写入一句话
        tokenId = 0x3;
        endtime = getUnxtimeNow() + 365 * 86400;
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );

        let ownerNewBalance = await getBalance(owner);
        // console.log('ownerNewBalance',ownerNewBalance.toString())
        


        const token_msg = await messageContractInterface.readMsg(tokenId);

        expect(token_msg[0]).to.equal('futuremessage1');
        expect(token_msg[1]).to.equal(ethers.utils.parseEther("0.17"));
        expect(token_msg[2]).to.equal(endtime);

        //管理员要收到钱，
        let ownerDelta = ownerNewBalance.sub(ownerOldBalance);
        expect(ethers.utils.parseEther("0.03").toString()).to.equal(ownerDelta.toString());

        //用户要收到这个erc721的token
        expect(await messageContractInterface.ownerOf(tokenId)).to.equal(await addr1.getAddress());


        ///测试event被发送
        // await expect(messageContractInterface.connect(addr1).write_message('address 1 message'))
        //     .to.emit(messageContractInterface, "MessageSet")
        //     .withArgs(await addr1.getAddress(), "address 1 message");

        ///读取刚才写的话和写入一致
        // const addr1Message = await messageContractInterface.read_message(
        //     await addr1.getAddress()
        // );
        // expect(addr1Message).to.equal('address 1 message');

    });

    it("测试 如果用户发送金额小于0.03则不会成功", async function () {
        tokenId = 0x4;
        endtime = getUnxtimeNow() + 365 * 86400;
        ret = messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.02")
            }
        );
        await expectRevert(ret, "FM: Insufficient value");
    });

    // it("测试 测试如果endtime小于1年的话也不能成功", async function () {
    //     tokenId = 0x5;
    //     endtime = getUnxtimeNow() + 300 * 86400;
    //     ret = messageContractInterface.connect(addr1).mint(
    //         await addr1.getAddress(),
    //         tokenId,
    //         endtime,
    //         'futuremessage1',
    //         {
    //             value: ethers.utils.parseEther("0.2")
    //         }
    //     );
    //     await expectRevert(ret, "FM: timestamp must large then 1 year");
    // });

    it("测试 如果大于10年的时间则不会成功", async function () {
        tokenId = 0x6;
        endtime = getUnxtimeNow() + 3660 * 86400;
        ret = messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );
        await expectRevert(ret, "FM: timestamp must less then 10 year");
    });

    it("测试 到期以后用户可以取出余额", async function () {

        tokenId = 0x7;
        endtime = getUnxtimeNow();
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );

        // await delay(1000);

        let addr1_address = await addr1.getAddress();

        let addr1OldBalance = await getBalance(addr1);
        // console.log('addr1OldBalance',addr1OldBalance);
        // console.log('address: %s , amount : %s',addr1_address,addr1OldBalance.toString());
        
        let tx = await messageContractInterface.connect(addr1).withdrawal(
            await addr1.getAddress(),
            tokenId
        );
        const receipt = await tx.wait();
        // console.log('receipt',receipt);
        const gasUsed = receipt.gasUsed;
        
        await tx;

        let addr1NewBalance = await getBalance(addr1);
        
        let gas_fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        let addr1Delta = addr1NewBalance.sub(addr1OldBalance).add(gas_fee);

        expect(ethers.utils.parseEther("0.17").toString()).to.equal(addr1Delta.toString());



    });

    it("测试 如果代币被转移给其他账户，原来账户就不能取出余额", async function () {
        tokenId = 0x7;
        endtime = getUnxtimeNow();
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );

        //add1转移给add2
        await messageContractInterface.connect(addr1).transferFrom(await addr1.getAddress(),await addr2.getAddress(),tokenId)

        //断言现在的owner是addr2
        let now_owner_address = await messageContractInterface.connect(addr1).ownerOf(tokenId);
        expect(now_owner_address).to.equal(await addr2.getAddress());

        //从addr1取出余额应该要报错
        let ret2 = messageContractInterface.connect(addr1).withdrawal(
            await addr1.getAddress(),
            tokenId
        );
        await expectRevert(ret2, "'ERC721: transfer from incorrect owner");
        
    });

    it("测试 如果代币被转移给其他账户，其他账户到期以后可以取出余额", async function () {

        //add1先mint一个0x7的token
        tokenId = 0x7;
        endtime = getUnxtimeNow();
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );

        //add1转移给add2
        await messageContractInterface.connect(addr1).transferFrom(await addr1.getAddress(),await addr2.getAddress(),tokenId)

        //断言现在的owner是addr2
        let now_owner_address = await messageContractInterface.connect(addr1).ownerOf(tokenId);
        expect(now_owner_address).to.equal(await addr2.getAddress());

        //从addr2取出余额
        let addr2OldBalance = await getBalance(addr2);

        let tx = await messageContractInterface.connect(addr2).withdrawal(
            await addr2.getAddress(),
            tokenId
        );
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed;
        
        await tx;
        let addr2NewBalance = await getBalance(addr2);
        
        let gas_fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        let addr2Delta = addr2NewBalance.sub(addr2OldBalance).add(gas_fee);

        expect(ethers.utils.parseEther("0.17").toString()).to.equal(addr2Delta.toString());


    });

    it("测试 存入代币以后，用别的地址取款应该失败", async function () {

        //add1先mint一个0x7的token
        tokenId = 0x7;
        endtime = getUnxtimeNow();
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );


        //断言现在的owner是addr2
        let now_owner_address = await messageContractInterface.connect(addr1).ownerOf(tokenId);
        expect(now_owner_address).to.equal(await addr1.getAddress());

        //从addr2取出余额
        let ret2 = messageContractInterface.connect(addr2).withdrawal(
            await addr2.getAddress(),
            tokenId
        );

        await expectRevert(ret2, "ERC721: transfer from incorrect owner");

    });

    it("测试 存入代币以后，到期之前取款应该失败", async function () {

        //add1先mint一个0x7的token
        tokenId = 0x7;
        endtime = getUnxtimeNow();
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime+86400,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );


        //从addr2取出余额
        let ret2 = messageContractInterface.connect(addr1).withdrawal(
            await addr1.getAddress(),
            tokenId
        );

        await expectRevert(ret2, "FM: the withdrawal time must be greater than the allowable withdrawal time");

    });

    it("测试 存入代币以后，取款两次第二次应该失败", async function () {

        //add1先mint一个0x7的token
        tokenId = 0x7;
        endtime = getUnxtimeNow();
        ret = await messageContractInterface.connect(addr1).mint(
            await addr1.getAddress(),
            tokenId,
            endtime,
            'futuremessage1',
            {
                value: ethers.utils.parseEther("0.2")
            }
        );


        //从addr1取出余额
        let addr1OldBalance = await getBalance(addr1);
        let tx = await messageContractInterface.connect(addr1).withdrawal(
            await addr1.getAddress(),
            tokenId
        );
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed;
        
        await tx;
        let addr1NewBalance = await getBalance(addr1);

        let gas_fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        let addr1Delta = addr1NewBalance.sub(addr1OldBalance).add(gas_fee);
        expect(ethers.utils.parseEther("0.17").toString()).to.equal(addr1Delta.toString());


        //从addr2取出余额
        let tx2 = messageContractInterface.connect(addr1).withdrawal(
            await addr1.getAddress(),
            tokenId
        );
        await expectRevert(tx2, "FM: this token is been withdrawed yet");

        //同时要查看用户的账户被加了多少钱
    });

  });
});