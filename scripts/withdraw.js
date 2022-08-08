const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundme = await ethers.getContract("FundMe", deployer)
    console.log("funding...")
    const TransactionResponse = await fundme.withdraw()
    await TransactionResponse.wait(1)
    console.log("Withdrawal completed")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
