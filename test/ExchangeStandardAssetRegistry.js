import assertRevert from './helpers/assertRevert'

const BigNumber = web3.BigNumber

const StandardAssetRegistry = artifacts.require('StandardAssetRegistryTest')
const Exchange =  artifacts.require('Exchange')

const NONE = '0x0000000000000000000000000000000000000000'

require('chai')
.use(require('chai-as-promised'))
.use(require('chai-bignumber')(BigNumber))
.should()

const expect = require('chai').expect;

contract('Exchange', accounts => {
  const [creator, user, anotherUser, operator, mallory] = accounts
  let registry = null
  let exchange = null
  const alternativeAsset = {id: 2, data: 'data2'}
  const sentByCreator = {from: creator}
  const sentByUser = {from: user}
  const creationParams = {
    gas: 4e6,
    gasPrice: 21e9,
    from: creator
  }
  const CONTENT_DATA = 'test data'

  beforeEach(async () => {
    registry = await StandardAssetRegistry.new(creationParams)
    exchange = await Exchange.new(registry.address)
    await registry.generate(0, creator, sentByCreator)
    await registry.generate(1, creator, sentByCreator)
  })

  describe('Exchange operations', () => {
    it('buys an specific asset', async () => {
      await registry.setApprovalForAll(exchange.address, true)
      await exchange.sell(0, 100, sentByCreator)
      await exchange.buy(0, { ...sentByUser, value: 100 })
      const assets = await registry.balanceOf(user)
      assets.should.be.bignumber.equal(1)
    })

    it('refunds remaining balance', async () => {
      const originalBalance = web3.eth.getBalance(user)
      await registry.setApprovalForAll(exchange.address, true)
      await exchange.sell(0, web3.toWei(10, 'ether'), sentByCreator)
      await exchange.buy(0, { ...sentByUser, value: web3.toWei(20, 'ether') })
      const currentBalance = web3.eth.getBalance(user);
      const diff = originalBalance.toNumber() - currentBalance.toNumber()
      Math.round(web3.fromWei(diff, 'ether')).should.equal(10) // round down the gas
    })

    it('reverts when buying without authorization', async () => {
      await exchange.sell(0, 100, sentByCreator)
      await assertRevert(exchange.buy(0, { ...sentByUser, value: 100 }))
    })

    it('reverts when selling a non existing asset', async () => {
      await assertRevert(exchange.sell(2, 200, sentByCreator))
    })

    it('reverts when buying an asset not on sale', async () => {
      await assertRevert(exchange.buy(2))
    })

    it('reverts when trying to buy with insufficient funds', async () => {
      await exchange.sell(0, 100, sentByCreator)
      await assertRevert(exchange.buy(0, { ...sentByUser, value: 50 }))
    })

    it('reverts when transferring an asset to himself', async () => {
      await registry.setApprovalForAll(exchange.address, true)
      await exchange.sell(1, 1, sentByCreator)
      await assertRevert(exchange.buy(1, { ...sentByCreator, value: 1 }))
    })
  })
})
