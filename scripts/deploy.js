async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log(
      "Deploying futuremessage contracts with the account:",
      await deployer.getAddress()
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const FM = await ethers.getContractFactory("FutureMessage");
    const token = await FM.deploy();
  
    await token.deployed();
  
    console.log("Token address:", token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
  