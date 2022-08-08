const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { developmentchain } = require("../../helper-hardhat-config")
//require("@nomiclabs/hardhat-waffle")
//require("ethereum-waffle")
!developmentchain.includes(network.name)
    ? describe.skip // this means our unit test will only run in the development chain.
    : describe("FundMe", async function () {
          let fundme
          let deployer
          let MockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // we can also write "1000000000000000000".
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundme = await ethers.getContract("FundMe", deployer)
              MockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundme.getPricefeed()
                  assert.equal(response, MockV3Aggregator.address)
              })
          })
          describe("fund", async function () {
              it("fails if insufficient ETH", async function () {
                  //await expect(fundme.fund()).to.be.revertedWith("Insufficient ETH")
                  await expect(fundme.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Updated the amount funded data structure", async function () {
                  await fundme.fund({ value: sendValue })
                  const response = await fundme.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              }) // use command yarn hardhat test --grep "amount funded"
              //grep command is used to search string.
              it("Adds funder to array of getFunders", async function () {
                  await fundme.fund({ value: sendValue })
                  const funder = await fundme.getFunders(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundme.fund({ value: sendValue }) // since withdrawal needs existing funds to execute.
              })
              it("withdraw ETH from a single funder", async function () {
                  //arrange
                  const startingFundmeBalance =
                      await fundme.provider.getBalance(fundme.address)
                  const startingDeployerBalance =
                      await fundme.provider.getBalance(deployer)
                  //Act
                  const TransactionResponse = await fundme.withdraw()
                  const TransactionReceipt = await TransactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = TransactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingfundmeBalance = await fundme.provider.getBalance(
                      fundme.address
                  )
                  const endingDeployerBalance =
                      await fundme.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingfundmeBalance, 0)
                  assert.equal(
                      startingFundmeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("cheaper withdraw ETH from a single funder", async function () {
                  //arrange
                  const startingFundmeBalance =
                      await fundme.provider.getBalance(fundme.address)
                  const startingDeployerBalance =
                      await fundme.provider.getBalance(deployer)
                  //Act
                  const TransactionResponse = await fundme.cheaperWithdraw()
                  const TransactionReceipt = await TransactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = TransactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingfundmeBalance = await fundme.provider.getBalance(
                      fundme.address
                  )
                  const endingDeployerBalance =
                      await fundme.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingfundmeBalance, 0)
                  assert.equal(
                      startingFundmeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("It allows to withdraw with multiple accounts", async function () {
                  //arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundmeConnectAccounts = await fundme.connect(
                          accounts[i]
                      )
                      await fundmeConnectAccounts.fund({ value: sendValue })
                  }
                  const startingFundmeBalance =
                      await fundme.provider.getBalance(fundme.address)
                  const startingDeployerBalance =
                      await fundme.provider.getBalance(deployer)
                  //Act
                  const TransactionResponse = await fundme.withdraw()
                  const TransactionReceipt = await TransactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = TransactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert
                  const endingfundmeBalance = await fundme.provider.getBalance(
                      fundme.address
                  )
                  const endingDeployerBalance =
                      await fundme.provider.getBalance(deployer)
                  assert.equal(endingfundmeBalance, 0)
                  assert.equal(
                      startingFundmeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //to be sure the getFunders are reset properly
                  await expect(fundme.getFunders(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundme.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectContract = await fundme.connect(attacker)
                  await expect(
                      attackerConnectContract.withdraw()
                  ).to.be.revertedWith("Fundme_NotOwner")
              })
              it("It allows to cheaper withdraw with multiple accounts", async function () {
                  //arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundmeConnectAccounts = await fundme.connect(
                          accounts[i]
                      )
                      await fundmeConnectAccounts.fund({ value: sendValue })
                  }
                  const startingFundmeBalance =
                      await fundme.provider.getBalance(fundme.address)
                  const startingDeployerBalance =
                      await fundme.provider.getBalance(deployer)
                  //Act
                  const TransactionResponse = await fundme.cheaperWithdraw()
                  const TransactionReceipt = await TransactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = TransactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert
                  const endingfundmeBalance = await fundme.provider.getBalance(
                      fundme.address
                  )
                  const endingDeployerBalance =
                      await fundme.provider.getBalance(deployer)
                  assert.equal(endingfundmeBalance, 0)
                  assert.equal(
                      startingFundmeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //to be sure the getFunders are reset properly
                  await expect(fundme.getFunders(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundme.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
