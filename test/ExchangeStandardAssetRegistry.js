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
    await registry.generate(0, CONTENT_DATA, sentByCreator)
    await registry.generate(1, CONTENT_DATA, sentByCreator)
  })

  describe('Exchange a non existing asset', () => {
    it('tries to sell a non existing asset', async () => {
      await assertRevert(exchange.sell(2, 200, sentByCreator))
    })
    it('tries to buy a non existing asset', async () => {
      await assertRevert(exchange.buy(2))
    })
  })

  describe('Exchange asset to the same user', () => {
    xit('tries to transfer an asset to himself', async () => {
      await registry.authorizeOperator(exchange.address, true)
      await exchange.sell(1, 1, sentByCreator)
      await assertRevert(exchange.buy(1, { ...sentByCreator, value: 1 }))
    })
  })
})