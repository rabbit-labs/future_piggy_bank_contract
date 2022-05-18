const {BigNumber} = require("ethers");

function m(num, decimals) {
    return BigNumber.from(num).mul(BigNumber.from(10).pow(decimals))
}

async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log(
      "Deploying mock usdt contracts with the account:",
      await deployer.getAddress()
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    usdt = await MockERC20.deploy('MockUSDT', 'USDT')
    await usdt.deployed()

    console.log('token address:',usdt.address);

    await usdt.mint(deployer.address, m(10000000, 18))


}

  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
  