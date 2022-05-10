
// // We import Chai to use its asserting functions here.
// const { expect } = require("chai");

// // `describe` is a Mocha function that allows you to organize your tests. It's
// // not actually needed, but having your tests organized makes debugging them
// // easier. All Mocha functions are available in the global scope.

// // `describe` receives the name of a section of your test suite, and a callback.
// // The callback must define the tests of that section. This callback can't be
// // an async function.
// describe("Message contract", function () {
//   // Mocha has four functions that let you hook into the the test runner's
//   // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

//   // They're very useful to setup the environment for tests, and to clean it
//   // up after they run.

//   // A common pattern is to declare some variables, and assign them in the
//   // `before` and `beforeEach` callbacks.

//   let MessageContract;
//   let messageContractInterface;
//   let owner;
//   let addr1;
//   let addr2;
//   let addrs;

//   // `beforeEach` will run before each test, re-deploying the contract every
//   // time. It receives a callback, which can be async.
//   beforeEach(async function () {
//     // Get the ContractFactory and Signers here.
//     MessageContract = await ethers.getContractFactory("Message");
//     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

//     // To deploy our contract, we just have to call Token.deploy() and await
//     // for it to be deployed(), which happens onces its transaction has been
//     // mined.
//     messageContractInterface = await MessageContract.deploy();
//     await messageContractInterface.deployed();

//     // We can interact with the contract by calling `hardhatToken.method()`
//     // await hardhatToken.deployed();
//   });

//   // You can nest describe calls to create subsections.
//   describe("测试部署message合约", function () {

//     it("owner测试", async function () {
//         expect(await messageContractInterface.owner()).to.equal(await owner.getAddress());
//     });

//   });

//   describe("测试留言模块", function () {

//     it("测试写入一句话到blockchain", async function () {

//         ///写入一句话
//         await messageContractInterface.connect(addr1).write_message('address 1 message');
      
//         ///测试event被发送
//         await expect(messageContractInterface.connect(addr1).write_message('address 1 message'))
//             .to.emit(messageContractInterface, "MessageSet")
//             .withArgs(await addr1.getAddress(), "address 1 message");

//         ///读取刚才写的话和写入一致
//         const addr1Message = await messageContractInterface.read_message(
//             await addr1.getAddress()
//         );
//         expect(addr1Message).to.equal('address 1 message');

//     });

//     it("测试更新一句话到blockchain", async function () {

//         await messageContractInterface.connect(addr1).write_message('address 1 message');
//         await messageContractInterface.connect(addr1).write_message('address 1 message new');
//         await messageContractInterface.connect(addr2).write_message('address 2 message');

//         ///读取刚才写的话是第二次的写入
//         await expect(
//             await messageContractInterface.read_message(await addr1.getAddress())
//         ).to.equal("address 1 message new");

//         ///读取刚才address2写的话不被影响
//         await expect(
//             await messageContractInterface.read_message(await addr2.getAddress())
//         ).to.equal("address 2 message");
//     });


//   });
// });