
// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const {BigNumber} = require("ethers");

describe("FutureMessage contract", function () {

    let MessageContract;
    let messageContractInterface;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    let provider;

    beforeEach(async function () {
        MessageContract = await ethers.getContractFactory("FutureMessage");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        messageContractInterface = await MessageContract.deploy();
        await messageContractInterface.deployed();

        provider = ethers.getDefaultProvider();

    });

    it('deploy', async function () {
        const MockERC20 = await ethers.getContractFactory('MockERC20')
        usdt = await MockERC20.deploy('MockUSDT', 'USDT')
        await usdt.deployed()
        // console.log('usdt deployed:', usdt.address)
		await usdt.mint(addr1.address, m(1000, 18))
        // console.log('usdt mint to accounts[0]', d(await usdt.balanceOf(addr1.address), 18))
		await usdt.mint(addr2.address, m(1000, 18))
        // console.log('usdt mint to accounts[1]', d(await usdt.balanceOf(addr2.address), 18))
    })



    describe("测试部署message合约", function () {

        it("owner测试", async function () {
            expect(await messageContractInterface.owner()).to.equal(await owner.getAddress());
        });

    });

    describe("测试 baseURI相关", function () {

        it("测试 基本的baseURI要和预期一致", async function () {
            
            let endtime = getUnxtimeNow() + 365 * 86400;
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');
            expect(tokenId).to.equal('1');

            const tokenURI = await messageContractInterface.tokenURI(tokenId);
            expect(tokenURI).to.equal('https://worker.future-piggy-bank.workers.dev/metadata/1');

            //修改baseTokenURI
            const ret = await messageContractInterface.connect(owner).setBaseURI('https://nft.future-piggy-bank.workers.dev/metadata/')
            const tokenURI2 = await messageContractInterface.tokenURI(tokenId);
            expect(tokenURI2).to.equal('https://nft.future-piggy-bank.workers.dev/metadata/1');

            //非作者修改baseTokenURI
            const ret2 = messageContractInterface.connect(addr1).setBaseURI('https://nft2.future-piggy-bank.workers.dev/metadata/')
            await expectRevert(ret2, "Ownable: caller is not the owner");

       
        });

    });


    describe("测试mintToken", function () {

        it("测试mint一个token并附上一定的eth", async function () {

            let ownerOldBalance = await getBalance(owner);
            // console.log('ownerOldBalance',ownerOldBalance.toString())

            ///写入一句话
            let endtime = getUnxtimeNow() + 365 * 86400;
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');
            expect(tokenId).to.equal('1');

            let ownerNewBalance = await getBalance(owner);

            const token_msg = await messageContractInterface.readMsg(tokenId);
            expect(token_msg['content']).to.equal('futuremessage1');
            expect(token_msg['amount']).to.equal(ethers.utils.parseEther("0.17"));
            expect(token_msg['endTime']).to.equal(endtime);
            expect(token_msg['depositTime']).to.gt(0);

            //管理员要收到钱，
            let ownerDelta = ownerNewBalance.sub(ownerOldBalance);
            expect(ethers.utils.parseEther("0.03").toString()).to.equal(ownerDelta.toString());

            //用户要收到这个erc721的token
            expect(await messageContractInterface.ownerOf(tokenId)).to.equal(await addr1.getAddress());


        });

        it("测试 如果用户发送金额小于0.03则不会成功", async function () {
            endtime = getUnxtimeNow() + 365 * 86400;
            let ret = mintTokenTx(addr1,endtime,'futuremessage1','0.02')
            await expectRevert(ret, "FM: Insufficient value");
        });

        it("测试 如果mint2次的话第二次的tokenId应该是上一次的+1", async function () {
            endtime = getUnxtimeNow() + 365 * 86400;

            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');

            let tokenId2 = await mintToken(addr1,endtime,'futuremessage1','0.2');
            expect(Number(tokenId2)).to.equal(Number(tokenId)+1);

        });

        it("测试 存入一个erc20代币", async function () {

            let ownerOldBalance = await getBalance(owner);
            // console.log('ownerOldBalance',ownerOldBalance.toString())

            await usdt.connect(addr1).approve(messageContractInterface.address, m(100, 18))
            // console.log('step 1 approve done')
    
            let endtime = getUnxtimeNow() + 365 * 86400;
            let tokenId = await mintTokenWithErc20(addr1,endtime,'futuremessage3',usdt.address, m(100, 18));

            // console.log('step 2 mintTokenFM done')

            ///写入一句话
            expect(tokenId).to.equal('1');

            let ownerNewBalance = await getBalance(owner);

            const token_msg = await messageContractInterface.readMsg(tokenId);
            expect(token_msg['content']).to.equal('futuremessage3');
            expect(token_msg['amount']).to.equal(m(100, 18));
            expect(token_msg['endTime']).to.equal(endtime);
            expect(token_msg['depositTime']).to.gt(0);

            //管理员要收到钱，
            let ownerDelta = ownerNewBalance.sub(ownerOldBalance);
            expect(ethers.utils.parseEther("0.03").toString()).to.equal(ownerDelta.toString());

            //用户要收到这个erc721的token
            expect(await messageContractInterface.ownerOf(tokenId)).to.equal(await addr1.getAddress());


        });

        it("测试 到期以后用户可以取出余额(ERC20)", async function () {

            await usdt.connect(addr1).approve(messageContractInterface.address, m(100, 18))

            endtime = getUnxtimeNow();
            let tokenId = await mintTokenWithErc20(addr1,endtime,'futuremessage1',usdt.address, m(100, 18));

            let addr1_usdt_balance =  await usdt.balanceOf(addr1.address)

            let tx = await messageContractInterface.connect(addr1).withdrawal(
                await addr1.getAddress(),
                tokenId
            );
            const receipt = await tx.wait();
            
            await tx;

            let addr1_usdt_balance_new =  await usdt.balanceOf(addr1.address)
            
            let addr1_usdt_delta = addr1_usdt_balance_new.sub(addr1_usdt_balance);

            expect(addr1_usdt_delta.toString()).to.equal(m(100, 18));

        });

        it("测试 存入代币以后，取款两次第二次应该失败(ERC20)", async function () {

            await usdt.connect(addr1).approve(messageContractInterface.address, m(100, 18))

            //add1先mint一个0x7的token
            endtime = getUnxtimeNow();
            let tokenId = await mintTokenWithErc20(addr1,endtime,'futuremessage1',usdt.address, m(100, 18));

            //从addr1取出余额
            let addr1_usdt_balance =  await usdt.balanceOf(addr1.address)

            let tx = await messageContractInterface.connect(addr1).withdrawal(
                await addr1.getAddress(),
                tokenId
            );
            const receipt = await tx.wait();
            await tx;

            let addr1_usdt_balance_new =  await usdt.balanceOf(addr1.address)
            let addr1_usdt_delta = addr1_usdt_balance_new.sub(addr1_usdt_balance);

            expect(addr1_usdt_delta.toString()).to.equal(m(100, 18));

            //从addr2取出余额
            let tx2 = messageContractInterface.connect(addr1).withdrawal(
                await addr1.getAddress(),
                tokenId
            );
            await expectRevert(tx2, "FM: this token is been withdrawed yet");

            //同时要查看用户的账户被加了多少钱
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
            endtime = getUnxtimeNow() + 3660 * 86400;
            let ret = messageContractInterface.connect(addr1).mintFM(
                await addr1.getAddress(),
                endtime,
                'futuremessage1',
                {
                    value: ethers.utils.parseEther("0.2")
                }
            );
            await expectRevert(ret, "FM: timestamp must less then 10 year");
        });

        it("测试 到期以后用户可以取出余额", async function () {

            endtime = getUnxtimeNow();
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');

            let addr1_address = await addr1.getAddress();
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



        });

        it("测试 如果代币被转移给其他账户，原来账户就不能取出余额", async function () {
            endtime = getUnxtimeNow();
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');

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
            endtime = getUnxtimeNow();
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');


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
            // const gasUsed = receipt.gasUsed;
            await tx;

            let addr2NewBalance = await getBalance(addr2);
            let gas_fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
            let addr2Delta = addr2NewBalance.sub(addr2OldBalance).add(gas_fee);

            expect(ethers.utils.parseEther("0.17").toString()).to.equal(addr2Delta.toString());


        });

        it("测试 存入代币以后，用别的地址取款应该失败", async function () {

            //add1先mint一个0x7的token
            endtime = getUnxtimeNow();
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');


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
            endtime = getUnxtimeNow() + 86400;
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');


            //从addr2取出余额
            let ret2 = messageContractInterface.connect(addr1).withdrawal(
                await addr1.getAddress(),
                tokenId
            );

            await expectRevert(ret2, "FM: the withdrawal time must be greater than the allowable withdrawal time");

        });

        it("测试 存入代币以后，取款两次第二次应该失败", async function () {

            //add1先mint一个0x7的token
            endtime = getUnxtimeNow();
            let tokenId = await mintToken(addr1,endtime,'futuremessage1','0.2');

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


    describe("测试 查看TOKEN列表", function () {


        it("测试 getUserList:测试可以正常的拿到数据，包含（正常获得第一页数据，代币transfer以后数据变化，offset传入一个超出的值）", async function () {
            
            endtime = getUnxtimeNow() + 365 * 86400;

            let tokenId = await mintToken(addr1,endtime,'testmsg1','0.2');
            let tokenId2 = await mintToken(addr1,endtime,'testmsg2','0.2');
            let tokenId3 = await mintToken(addr2,endtime,'testmsg3','0.15');

            expect(Number(tokenId2)).to.equal(Number(tokenId)+1);

            let addr1_address = await addr1.getAddress();
            let addr2_address = await addr2.getAddress();

            let msgs1;
            let msgs2;

            //1.测试2个用户的数据结果都没问题
            msgs1 = await messageContractInterface.getTokenListByAddress(addr1_address, 0, 10)
            expect(msgs1.length).to.equal(2);

            msgs2 = await messageContractInterface.getTokenListByAddress(addr2_address, 0, 10)
            expect(msgs2.length).to.equal(1);

            //2.测试Token转移以后，用户的数据结果也有变化
            await messageContractInterface.connect(addr1).transferFrom(await addr1.getAddress(),await addr2.getAddress(),tokenId)

            msgs1 = await messageContractInterface.getTokenListByAddress(addr1_address, 0, 10)
            expect(msgs1.length).to.equal(1);

            msgs2 = await messageContractInterface.getTokenListByAddress(addr2_address, 0, 10)
            expect(msgs2.length).to.equal(2);

            //3.测试offset超过以后，会返回空数据
            msgs1 = await messageContractInterface.getTokenListByAddress(addr1_address, 10, 10)
            expect(msgs1.length).to.equal(0);

        });

        it("测试 用户写入超过40个信息的话，可以按照顺序拿到第二页", async function () {
            
            endtime = getUnxtimeNow() + 365 * 86400;

            const promises = [];
            for (let index = 0; index < 40; index++) {
                promises.push(await mintToken(addr1,endtime,'futuremessage'+index,'0.2'));
            }
     
            await Promise.all(promises);

            //调用getTokenListByAddress
            let addr1_address = await addr1.getAddress();
            let msgs1 = await messageContractInterface.getTokenListByAddress(addr1_address, 0, 10)
            expect(msgs1.length).to.equal(10);
            expect(msgs1[0]['content']).to.equal('futuremessage0');
            expect(msgs1[9]['content']).to.equal('futuremessage9');

            let msgs2 = await messageContractInterface.getTokenListByAddress(addr1_address, 10, 10)
            expect(msgs2.length).to.equal(10);
            expect(msgs2[0]['content']).to.equal('futuremessage10');
            expect(msgs2[9]['content']).to.equal('futuremessage19');


        });

        it("测试 getTokenList:测试翻页数据没问题", async function () {
            
            endtime = getUnxtimeNow() + 365 * 86400;
            
            const promises = [];
            for (let index = 0; index < 40; index++) {
                promises.push(await mintToken(addr1,endtime,'futuremessage'+index,'0.2'));
            }
     
            await Promise.all(promises);

            //调用getTokenListByAddress
            let msgs1 = await messageContractInterface.getTokenList(0, 10)
            expect(msgs1.length).to.equal(10);
            expect(msgs1[0]['content']).to.equal('futuremessage39');
            expect(msgs1[9]['content']).to.equal('futuremessage30');

            let msgs2 = await messageContractInterface.getTokenList(10, 10)
            expect(msgs2.length).to.equal(10);
            expect(msgs2[0]['content']).to.equal('futuremessage29');
            expect(msgs2[9]['content']).to.equal('futuremessage20');

        });

        it("测试 getTokenList，包含第一页数据，和传入超出的offset以后的返回情况", async function () {
            
            endtime = getUnxtimeNow() + 365 * 86400;
            
            const promises = [];
            for (let index = 0; index < 1; index++) {
                promises.push(await mintToken(addr1,endtime,'futuremessage'+index,'0.2'));
            }
     
            await Promise.all(promises);

            //调用getTokenListByAddress
            let msgs1 = await messageContractInterface.getTokenList(0, 20)
            expect(msgs1.length).to.equal(1);

            let msgs2 = await messageContractInterface.getTokenList(10, 20)
            expect(msgs2.length).to.equal(0);

            // await expectRevert(ret2, "FM: offset must less then alltoken length");

        });

        it("测试 用户写2个数据，取0，20的时候", async function () {
            
            endtime = getUnxtimeNow() + 365 * 86400;

            const promises = [];
            for (let index = 0; index < 2; index++) {
                promises.push(await mintToken(addr1,endtime,'futuremessage'+index,'0.2'));
            }
     
            await Promise.all(promises);

            //调用getTokenListByAddress
            let addr1_address = await addr1.getAddress();
            let msgs1 = await messageContractInterface.getTokenListByAddress(addr1_address, 0, 20)
            expect(msgs1.length).to.equal(2);
            expect(msgs1[0]['content']).to.equal('futuremessage0');
            expect(msgs1[1]['content']).to.equal('futuremessage1');
            
        });


    });


    function m(num, decimals) {
        return BigNumber.from(num).mul(BigNumber.from(10).pow(decimals))
    }

    function d(bn, decimals) {
        return bn.mul(BigNumber.from(100)).div(BigNumber.from(10).pow(decimals)).toNumber() / 100
    }

    function b(num) {
        return BigNumber.from(num)
    }

    function n(bn) {
        return bn.toNumber()
    }

    function s(bn) {
        return bn.toString()
    }

    async function mintTokenTx(addr,endtime,message,value) {
        return messageContractInterface.connect(addr).mintFM(
            await addr.getAddress(),
            endtime,
            message,
            {
                value: ethers.utils.parseEther(value)
            }
        );
    }


    async function mintToken(addr,endtime,message,ether_value) {
        let tx = await messageContractInterface.connect(addr).mintFM(
            await addr.getAddress(),
            endtime,
            message,
            {
                value: ethers.utils.parseEther(ether_value)
            }
        );
        const rc = await tx.wait(); // 0ms, as tx is already confirmed
        const event = rc.events.find(event => event.event === 'Transfer');
        const [from, to, value] = event.args;
        let tokenId = value.toString();
        return tokenId;
    }

    async function mintTokenWithErc20Tx(addr,endtime,message,token_address,token_amount) {
        return messageContractInterface.connect(addr).mintTokenFM(
            await addr.getAddress(),
            endtime,
            message,
            token_address,
            token_amount,
            {
                value: ethers.utils.parseEther('0.03')
            }
        );
    }


    async function mintTokenWithErc20(addr,endtime,message,token_address,token_amount) {
        let tx = await messageContractInterface.connect(addr).mintTokenFM(
            await addr.getAddress(),
            endtime,
            message,
            token_address,
            token_amount,
            {
                value: ethers.utils.parseEther('0.03')
            }
        );
        const rc = await tx.wait(); // 0ms, as tx is already confirmed
        const event = rc.events.find(event => event.event === 'Transfer');
        const [from, to, value] = event.args;
        let tokenId = value.toString();
        return tokenId;
    }


    const getUnxtimeNow = () => {
        return Math.floor(Date.now() / 1000);
    }
    
    const getBalance = async (add) => {
        return await ethers.provider.getBalance(await add.getAddress());
    }
    
    const delay = async(time) => {
        return new Promise(resolve => setTimeout(resolve, time));
    }

      
});