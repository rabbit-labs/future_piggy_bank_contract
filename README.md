<div align="center"><img src="./docs/banner_logo.png"></div>

# About Project 

FuturePiggyBank is a special NFT protocol that allows depositing ETH or ERC20 assets with a specified expiration date and adding a rider; the assets can be withdrawn after expiration.

The idea of FuturePiggyBank came from my own experience of buying bitcoins years ago, at the most I owned 9 BTC, but most of them were sold during the ups and downs, and I'm sure many of you have had similar experiences. Always wishing I had just held onto BTC at the time, I created FuturePiggyBank with the goal of using a special NFT to allow you to leave yourself or a loved one a digital asset to be taken out at maturity.

- Using smart contracts and open source, you can guarantee the safety of the deposited assets.
- Using the ERC721 protocol, it allows you to get a physical NFT that you can see after depositing, and you can gift it to your loved ones through the form of Transfer
- The use of NextID function allows you to display the Twitter information of the holder in the NFT display page.

## Requirements.
- hardhat

## Deployment to local.
```
npx hardhat --network localhost run scripts/deploy.js
```

## Test
```
npx hardhat test
```
