import assertRevert from './helpers/assertRevert'

const BigNumber = web3.BigNumber

const StandardAssetRegistry = artifacts.require('StandardAssetRegistryTest')

const NONE = '0x0000000000000000000000000000000000000000'

function checkTransferLog(log, parcelId, from, to) {
  log.event.should.be.eq('Transfer')
  log.args.parcelId.should.be.bignumber.equal(parcelId)
  log.args.from.should.be.equal(from)
  log.args.to.should.be.equal(to)
}

function checkApproveLog(log, parcelId, from, to) {
  log.event.should.be.eq('Approve')
  log.args.parcelId.should.be.bignumber.equal(parcelId)
  log.args.owner.should.be.equal(from)
  log.args.beneficiary.should.be.equal(to)
}

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('StandardAssetRegistry', accounts => {
  const [creator, user, anotherUser, operator, mallory] = accounts
  let registry = null
  const _name = 'Test'
  const _symbol = 'TEST'
  const _firstAssetlId = 1
  const _secondParcelId = 2
  const _unknownParcelId = 3
  const sentByCreator = { from: creator }
  const creationParams = {
    gas: 4e6,
    gasPrice: 21e9,
    from: creator
  }

  beforeEach(async function() {
    registry = await StandardAssetRegistry.new(creationParams)
    await registry.generate(0, user, sentByCreator)
    await registry.generate(1, user, sentByCreator)
  })

  describe('name', () => {
    it('has a name', async () => {
      const name = await registry.name()
      name.should.be.equal(_name)
    })
  })

  describe('symbol', () => {
    it('has a symbol', async () => {
      const symbol = await registry.symbol()
      symbol.should.be.equal(_symbol)
    })
  })

  describe('totalSupply', () => {
    it('has a total supply equivalent to the inital supply', async () => {
      const totalSupply = await registry.totalSupply()
      totalSupply.should.be.bignumber.equal(2)
    })
    it('has a total supply that increases after creating a new registry', async () => {
      let totalSupply = await registry.totalSupply()
      totalSupply.should.be.bignumber.equal(2)
      await registry.generate(100, anotherUser, sentByCreator)
      totalSupply = await registry.totalSupply()
      totalSupply.should.be.bignumber.equal(3)
    })
  })

  describe('assetCount', () => {
    it('has an amount of assets equivalent to the created assets', async () => {
      const assetCount = await registry.assetsCount(creator)
      assetCount.should.be.bignumber.equal(2)
    })

    it('has an amount of assets equivalent to the amount sent to the beneficiary', async () => {
      await registry.generate(3, user, '', sentByCreator)
      const assetCount = await registry.assetsCount(user)
      assetCount.should.be.bignumber.equal(1)
    })

    it('should consider destroyed assets', async () => {
      await registry.destroy(1)
      const assetCount = await registry.assetsCount(creator)
      assetCount.should.be.bignumber.equal(1)
    })

    it('should return 0 for an inexistent address', async () => {
      const assetCount = await registry.assetsCount(NONE)
      assetCount.should.be.bignumber.equal(0)
    })
  })

  describe('assetByIndex', () => {
    it('returns the id for the first asset of the holder', async () => {
      const assets = await registry.assetByIndex(creator, 0)
      assets.should.be.bignumber.equal(0)
    })

    it('reverts if the index is out of bounds', async () => {
      await assertRevert(registry.assetByIndex(creator, 10))
    })

    it('reverts if the index is out of bounds (negative)', async () => {
      await assertRevert(registry.assetByIndex(creator, -10))
    })

    it('reverts for an inexistent address', async () => {
      await assertRevert(registry.assetByIndex(NONE, 0))
    })
  })

  describe('assetsOf', () => {
    it('returns the created assets', async () => {
      const assets = await registry.assetsOf(creator)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members(['0', '1'])
    })

    it('returns an empty array for an address with no assets', async () => {
      const assets = await registry.assetsOf(user)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members([])
    })

    it('returns an empty array for an inexistent address', async () => {
      const assets = await registry.assetsOf(NONE)
      const convertedAssets = assets.map(big => big.toString())
      console.log(assets)
      convertedAssets.should.have.all.members([])
    })
  })

})
