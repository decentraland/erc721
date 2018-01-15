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
      try {
        const output = await registry.exists(true)
        assert.fail('should throw here')
      } catch (error) {
        assertRevert(error)
      }
    })
    it('throws is not id is provided', async () => {
      try {
        const output = await registry.exists()
        assert.fail('should throw here')
      } catch (error) {
        assertRevert(error)
      }
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
      try {
        const output = await registry.holderOf(true)
        assert.fail('should throw here')
      } catch (error) {
        assertRevert(error)
      }
    })
    it('throws is not id is provided', async () => {
      try {
        const output = await registry.holderOf()
        assert.fail('should throw here')
      } catch (error) {
        assertRevert(error)
      }
    })
  })

  describe('assetData', async () => {
    it ('should returns the proper data', async () => {
      const data = '0x6704fbfcd5ef766b287262fa2281c105d57246a6'
      const output = await registry.assetData(1)
      output.should.be.equal(data)
    })
    it('throws is not valid id', async () => {
      try {
        const output = await registry.assetData(true)
        assert.fail('should throw here')
      } catch (error) {
        assertRevert(error)
      }
    })
    it('throws is not id is provided', async () => {
      try {
        const output = await registry.assetData()
        assert.fail('should throw here')
      } catch (error) {
        assertRevert(error)
      }
    })

  })


})













