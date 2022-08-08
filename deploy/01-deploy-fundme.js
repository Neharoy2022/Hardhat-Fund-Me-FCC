//1. async function deployfunc(hre) {
//console.log("HI")
//hre.getNamedAccounts()
//hre.deployements()

const { getNamedAccounts, deployments, network } = require("hardhat")
const { networkconfig, developmentchain } = require("../helper-hardhat-config")
//const { network } = require("hardhat")
const { verify } = require("../utils/verify")

// module.exports.default = deployfunc
//}

// 2.module.exports = async (hre) => {
//  const {getNamedAccounts, deployement} = hre

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    //const EthUsdPriceFeed = networkconfig[chainId]["EthUsdPriceFeed"]

    let EthUsdPriceFeedAddress
    if (developmentchain.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        EthUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        EthUsdPriceFeedAddress = networkconfig[chainId]["EthUsdPriceFeed"]
    }
    log("--------------------------------------------------------")
    log("Deploying Fundme and waiting for confirmatioms.....")

    const args = [EthUsdPriceFeedAddress]
    const fundme = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed here.
        log: true,
        waitConfirmations: network.config.blockconfirmations || 1,
    })
    log(`FundMe deployed at ${fundme.address}`)

    if (
        !developmentchain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundme.address, args)
    }
}
module.exports.tags = ["all", "fundme"]
