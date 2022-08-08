const { getNamedAccounts, ethers, network } = require("hardhat")
const { assert } = require("chai")
const { developmentchain } = require("../../helper-hardhat-config")

developmentchain.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundme
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundme = await ethers.getContract("FundMe", deployer)
          })
          it("allows people to fund and withdraw", async function () {
              await fundme.fund({ value: sendValue })
              await fundme.withdraw()
              const endingBalance = await fundme.provider.getBalance(
                  fundme.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
