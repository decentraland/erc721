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

contract('StandardAssetRegistry', accounts => {
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
  /**
   * TESTS:
   * - Happy path user sells asset, another buy it
   * - Try to transfer an asset without permissions
   * - Try to transfer an non existing asset
   * - Try to transfer to the same user the asset
   * -
   */
  describe('test', () => {
    it('tests', async () => {

    })
  })
})