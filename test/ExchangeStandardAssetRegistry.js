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

  describe('Exchange operations', () => {
    it('buys an specific asset', async () => {
      await registry.authorizeOperator(exchange.address, true)
      await exchange.sell(0, 100, sentByCreator)
      await exchange.buy(0, { ...sentByUser, value: 100 })
      const assets = await registry.assetsOf(user)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members(['0'])
    })

    it('reverts when buying without authorization', async () => {
      await exchange.sell(0, 100, sentByCreator)
      await assertRevert(exchange.buy(0, { ...sentByUser, value: 100 }))
    })

    it('reverts when selling a non existing asset', async () => {
      await assertRevert(exchange.sell(2, 200, sentByCreator))
    })

    it('reverts when buying a non existing asset', async () => {
      await assertRevert(exchange.buy(2))
    })

    xit('reverts when transfering an asset to himself', async () => {
      await registry.authorizeOperator(exchange.address, true)
      await exchange.sell(1, 1, sentByCreator)
      await assertRevert(exchange.buy(1, { ...sentByCreator, value: 1 }))
    })
  })
})