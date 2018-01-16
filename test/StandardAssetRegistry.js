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

const expect = require('chai').expect;

contract('StandardAssetRegistry', accounts => {
  const [creator, user, anotherUser, operator, mallory] = accounts
  let registry = null
  const _name = 'Test'
  const _symbol = 'TEST'
  const _description = 'Loremp ipsum'
  const _firstAssetlId = 1
  const _secondParcelId = 2
  const _unknownParcelId = 3
  const sentByCreator = { from: creator }
  const creationParams = {
    gas: 4e6,
    gasPrice: 21e9,
    from: creator
  }
  const CONTENT_DATA = 'test data'

  beforeEach(async function() {
    registry = await StandardAssetRegistry.new(creationParams)
    await registry.generate(0, CONTENT_DATA, sentByCreator)
    await registry.generate(1, CONTENT_DATA, sentByCreator)
  })

  describe('Global Setters', () => {
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

    describe('description', () => {
      it('has a description', async () => {
        const description = await registry.description()
        description.should.be.equal(_description)
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
  })

  describe('exists', () => {
    it('ensures the asset exists after created', async () => {
      const output = await registry.exists(1)
      output.should.be.true      
    })
    it('ensures does return an assets if it does not exist', async () => {
      const output = await registry.exists(100)
      output.should.be.false
    })
    it('throws is not valid id', async () => {
      return Promise.all([
        registry.exists(true).should.be.rejected
      ])
    })
    it('throws is not id is provided', async () => {
      return Promise.all([
        registry.exists().should.be.rejected
      ])
    })
  })

  describe('holderOf', () => {
    it('should match the holder of the asset', async () => {
      const one = '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'
      const two = '0x0000000000000000000000000000000000000000'
      const outputOne = await registry.holderOf(1)
      const outputTwo = await registry.holderOf(2)
      outputOne.should.be.equal(one)
      outputTwo.should.be.equal(two)
    })
    it('throws is not valid id', async () => {
      return Promise.all([
        registry.holderOf(true).should.be.rejected
      ])
    })
    it('throws is not id is provided', async () => {
      return Promise.all([
        registry.holderOf().should.be.rejected
      ])
    })
  })

  describe('assetData', async () => {
    it ('should returns the proper data', async () => {
      const output = await registry.assetData(0)
      output.should.be.equal(CONTENT_DATA)
    })
    it('throws is not valid id', async () => {
      return Promise.all([
        registry.assetData(true).should.be.rejected
      ])
    })
    it('throws is not id is provided', async () => {
      return Promise.all([
        registry.assetData().should.be.rejected
      ])
    })

  })

  describe('assetCount', () => {
    it('has an amount of assets equivalent to the created assets', async () => {
      const assetCount = await registry.assetsCount(creator)
      assetCount.should.be.bignumber.equal(2)
    })

    xit('has an amount of assets equivalent to the amount sent to the beneficiary', async () => {
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
      convertedAssets.should.have.all.members([])
    })
  })

  describe('isContract', () => {
    it('returns true for a valid contract address', async () => {
      const isContract = await registry.isContractProxy(registry.address)
      isContract.should.equal(true)
    })

    it('returns false for a user address', async () => {
      const isContract = await registry.isContractProxy(user)
      isContract.should.equal(false)
    })

    it('returns false for an inexistant address', async () => {
      const isContract = await registry.isContractProxy(NONE)
      isContract.should.equal(false)
    })
  })

  describe('Transacions Related', () => {
    it('ensures the assets if passed to another owner after transfer', async () => {
      const CONTENT_DATA = 'ramdom data'
      const firstOwner = accounts[accounts.length - 2]
      await registry.generate(3, CONTENT_DATA, { from: creator })
      await registry.transfer(firstOwner, 3)
      const newOwner = await registry.holderOf(3)
      newOwner.should.be.equal(firstOwner)
    })
    it('ensures the sender owns the asset that is trying to send', async () => {
      const CONTENT_DATA = 'ramdom data'
      const randomOwner = accounts[accounts.length - 2]
      const buyer = accounts[accounts.length - 3]
      await registry.generate(4, CONTENT_DATA, { from: randomOwner })
      await assertRevert( registry.transfer(buyer, 4) )
    })
    it('ensure only the first operation owns the asset when multiple are exec', async () => {
      const CONTENT_DATA = 'ramdom data'
      const buyer = accounts[accounts.length - 2]
      await registry.generate(5, CONTENT_DATA, { from: creator })
      await registry.transfer(buyer, 5)
      await assertRevert( registry.transfer(accounts[accounts.length - 3], 5) )
      await assertRevert( registry.transfer(accounts[accounts.length - 4], 5) )
      await assertRevert( registry.transfer(accounts[accounts.length - 5], 5) )
      const newOwner = await registry.holderOf(5)
      newOwner.should.be.equal(buyer)     
    })
    it('throws if no params are sent', async () => {
      return Promise.all([
        registry.transfer().should.be.rejected
      ])
    })
    it('throws if asset is missing', async () => {
      const buyer = accounts[accounts.length - 2]
      return Promise.all([
        registry.transfer(buyer).should.be.rejected
      ])
    })
    xit('sends to itself should throw', async () => {
      const CONTENT_DATA = 'ramdom data'
      await registry.generate(6, CONTENT_DATA, { from: creator })
      await assertRevert( registry.transfer(creator, 6) )
    })
    xit('throws if asset is to transfer is missing', async () => {
      return Promise.all([
        registry.transfer(null, 1).should.be.rejected
      ])
    })
  })

})
