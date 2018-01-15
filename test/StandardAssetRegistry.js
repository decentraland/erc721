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

  beforeEach(async function() {
    registry = await StandardAssetRegistry.new(creationParams)
    await registry.generate(0, user, sentByCreator)
    await registry.generate(1, user, sentByCreator)
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

  describe('Supply Altering Functions', () => {
    describe('generate only with assetId', () => {
      it('asset create by creator', async () => {
        await registry.generate(2)
        console.log(await registry.holderOf(2))
      })
    })
  })

})
