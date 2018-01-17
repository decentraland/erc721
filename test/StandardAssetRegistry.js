import assertRevert, { assertError } from './helpers/assertRevert'

import getEIP820 from './helpers/getEIP820'

const BigNumber = web3.BigNumber

const StandardAssetRegistry = artifacts.require('StandardAssetRegistryTest')
const Holder = artifacts.require('Holder')
const NonHolder = artifacts.require('NonHolder')

const NONE = '0x0000000000000000000000000000000000000000'

function checkTransferLog(
  log,
  assetId,
  from,
  to,
  operator,
  userData,
  operatorData
) {
  log.event.should.be.eq('Transfer')
  log.args.assetId.should.be.bignumber.equal(assetId)
  log.args.from.should.be.equal(from)
  log.args.to.should.be.equal(to)
  log.args.operator.should.be.equal(operator)
  log.args.userData.should.be.equal(userData)
  log.args.operatorData.should.be.equal(operatorData)
}

function checkAuthorizationLog(log, operator, holder, authorized) {
  log.event.should.be.eq('AuthorizeOperator')
  log.args.operator.should.be.bignumber.equal(operator)
  log.args.holder.should.be.equal(holder)
  log.args.authorized.should.be.equal(authorized)
}

function checkUpdateLog(log, assetId, holder, operator) {
  log.event.should.be.eq('Update')
  log.args.assetId.should.be.bignumber.equal(assetId)
  log.args.holder.should.be.equal(holder)
  log.args.operator.should.be.equal(operator)
}

function checkCreateLog(log, holder, assetId, operator, data) {
  log.event.should.be.eq('Transfer')
  log.args.from.should.be.equal(NONE)
  log.args.to.should.be.equal(holder)
  log.args.assetId.should.be.bignumber.equal(assetId)
  log.args.operator.should.be.equal(operator)
  log.args.userData.should.be.equal(data)
}

function checkDestroyLog(log, holder, assetId, operator) {
  log.event.should.be.eq('Transfer')
  log.args.from.should.be.equal(holder)
  log.args.to.should.be.equal(NONE)
  log.args.assetId.should.be.bignumber.equal(assetId)
  log.args.operator.should.be.equal(operator)
}

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const expect = require('chai').expect

contract('StandardAssetRegistry', accounts => {
  const [creator, user, anotherUser, operator, mallory] = accounts
  let registry = null
  let EIP820 = null
  const _name = 'Test'
  const _symbol = 'TEST'
  const _description = 'lorem ipsum'
  const _firstAssetlId = 1
  const alternativeAsset = { id: 2, data: 'data2' }
  const sentByCreator = { from: creator }
  const sentByUser = { from: user }
  const creationParams = {
    gas: 4e6,
    gasPrice: 21e9,
    from: creator
  }
  const CONTENT_DATA = 'test data'

  beforeEach(async function() {
    registry = await StandardAssetRegistry.new(creationParams)
    EIP820 = await getEIP820(creator)
    await registry.generate(0, creator, CONTENT_DATA, sentByCreator)
    await registry.generate(1, creator, CONTENT_DATA, sentByCreator)
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
        await registry.generate(100, creator, anotherUser, sentByCreator)
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
    it('throws if not valid id', async () => {
      return Promise.all([registry.exists(true).should.be.rejected])
    })
    it('throws if id is not provided', async () => {
      return Promise.all([registry.exists().should.be.rejected])
    })
  })

  describe('holderOf', () => {
    it('should match the holder of the asset', async () => {
      const one = creator
      const two = NONE
      const outputOne = await registry.holderOf(1)
      const outputTwo = await registry.holderOf(2)
      outputOne.should.be.equal(one)
      outputTwo.should.be.equal(two)
    })
    it('throws if not valid id', async () => {
      return Promise.all([registry.holderOf(true).should.be.rejected])
    })
    it('throws if id is not provided', async () => {
      return Promise.all([registry.holderOf().should.be.rejected])
    })
  })

  describe('assetData', async () => {
    it('should returns the proper data', async () => {
      const output = await registry.assetData(0)
      output.should.be.equal(CONTENT_DATA)
    })
    it('throws if not valid id', async () => {
      return Promise.all([registry.assetData(true).should.be.rejected])
    })
    it('throws if id is not provided', async () => {
      return Promise.all([registry.assetData().should.be.rejected])
    })
  })

  describe('assetCount', () => {
    it('has an amount of assets equivalent to the created assets', async () => {
      const assetCount = await registry.assetCount(creator)
      assetCount.should.be.bignumber.equal(2)
    })

    it('has an amount of assets equivalent to the amount sent to the beneficiary', async () => {
      await registry.generate(3, user, '', sentByCreator)
      const assetCount = await registry.assetCount(user)
      assetCount.should.be.bignumber.equal(1)
    })

    it('should consider destroyed assets', async () => {
      await registry.destroy(1)
      const assetCount = await registry.assetCount(creator)
      assetCount.should.be.bignumber.equal(1)
    })

    it('should return 0 for a nonexistent address', async () => {
      const assetCount = await registry.assetCount(NONE)
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

    it('fails for a nonexistent address', async () => {
      await assertError(registry.assetByIndex(NONE, 0))
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

    it('returns an empty array for a nonexistent address', async () => {
      const assets = await registry.assetsOf(NONE)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members([])
    })
  })

  describe('transfer', () => {
    it('ensures the asset is passed to another owner after transfer', async () => {
      await registry.generate(3, creator, CONTENT_DATA, { from: creator })
      await registry.transfer(anotherUser, 3)
      const newOwner = await registry.holderOf(3)
      newOwner.should.be.equal(anotherUser)
    })
    it('ensures the sender owns the asset that is trying to send', async () => {
      await registry.generate(4, anotherUser, CONTENT_DATA, {
        from: anotherUser
      })
      await assertRevert(registry.transfer(operator, 4))
    })
    it("after receiving an asset, the receiver can't transfer the sender's other assets", async () => {
      await registry.generate(5, creator, CONTENT_DATA, { from: creator })
      await registry.transfer(user, 5)
      await assertRevert(registry.transfer(anotherUser, 5))
      await assertRevert(registry.transfer(operator, 5))
      await assertRevert(registry.transfer(mallory, 5))
      const newOwner = await registry.holderOf(5)
      newOwner.should.be.equal(user)
    })
    it('throws if no arguments are sent', async () => {
      assertError(registry.transfer())
    })
    it('throws if asset is missing', async () => {
      assertError(registry.transfer(anotherUser))
    })
    it('throws if asset is to transfer is missing', async () => {
      assertError(registry.transfer(null, 1))
    })
    const clear = ''
    it('works only if operator', async () => {
      await registry.generate(7, anotherUser, CONTENT_DATA, { from: creator })
      await registry.authorizeOperator(creator, true, { from: anotherUser })
      await registry.transferTo(user, 7, clear, clear, {
        from: creator
      })
    })
    it('reverts when trying to transfer and to address is the same as the holder address', async () => {
      await registry.generate(7, anotherUser, CONTENT_DATA, { from: creator })
      await assertRevert(
        registry.transferTo(anotherUser, 7, clear, clear, {
          from: anotherUser
        })
      )
    })
    it('throw if receiver is null', async () => {
      await registry.generate(8, creator, CONTENT_DATA, { from: creator })
      await assertRevert(
        registry.transferTo(NONE, 8, clear, clear, { from: creator })
      )
    })
  })

  describe('eip820 compatibility', () => {
    const USER_DATA = 'user'
    const OP_DATA = 'op'
    let holder
    let nonHolder
    before(async () => {
      holder = await Holder.new({ from: creator })
      nonHolder = await NonHolder.new({ from: creator })
    })

    it('holder receives the token', async () => {
      const asset = 102
      await registry.generate(asset, creator, CONTENT_DATA, { from: creator })
      await registry.transferTo(holder.address, asset, USER_DATA, OP_DATA, {
        from: creator
      })
      const newOwner = await registry.holderOf(asset)
      newOwner.should.be.equal(holder.address)
    })

    it('event is created', async () => {
      const asset = 101
      await registry.generate(asset, creator, CONTENT_DATA, { from: creator })
      const { logs } = await registry.transferTo(
        holder.address,
        asset,
        USER_DATA,
        OP_DATA,
        { from: creator }
      )
      checkTransferLog(
        logs[0],
        asset,
        creator,
        holder.address,
        creator,
        '0x' + new Buffer(USER_DATA).toString('hex'),
        '0x' + new Buffer(OP_DATA).toString('hex')
      )
    })

    it('non holder does not receive the token', async () => {
      const asset = 100
      await registry.generate(asset, creator, CONTENT_DATA, { from: creator })
      await assertRevert(
        registry.transferTo(nonHolder.address, asset, USER_DATA, OP_DATA, {
          from: creator
        })
      )
    })
  })

  describe('generate', () => {
    it('generates an asset with empty data', async () => {
      await registry.generate(alternativeAsset.id, user, '', sentByUser)
      const data = await registry.assetData(alternativeAsset.id)
      data.should.be.empty
    })

    it('generates an asset with data', async () => {
      await registry.generate(
        alternativeAsset.id,
        user,
        alternativeAsset.data,
        sentByUser
      )
      const data = await registry.assetData(alternativeAsset.id)
      data.should.be.equal(alternativeAsset.data)
    })

    it('emits a Create event', async () => {
      const { logs } = await registry.generate(
        alternativeAsset.id,
        user,
        alternativeAsset.data,
        sentByUser
      )
      logs.length.should.be.equal(1)
      checkCreateLog(
        logs[0],
        user,
        alternativeAsset.id,
        user,
        '0x' + new Buffer(alternativeAsset.data).toString('hex')
      )
    })

    it('generates multiple assets', async () => {
      await registry.generate(
        alternativeAsset.id,
        user,
        alternativeAsset.data,
        sentByUser
      )
      await registry.generate(3, user, 'data3', sentByUser)
      await registry.generate(4, user, 'data4', sentByUser)
      const assets = await registry.assetsOf(user)
      const assetsData = await Promise.all(
        assets.map(asset => registry.assetData(asset))
      )
      assetsData.should.have.all.members([
        alternativeAsset.data,
        'data3',
        'data4'
      ])
    })

    it('fails if the assetId is already in use', async () => {
      await registry.generate(
        alternativeAsset.id,
        user,
        alternativeAsset.data,
        sentByUser
      )
      await assertRevert(
        registry.generate(alternativeAsset.id, user, 'anotherData', sentByUser)
      )
    })

    it('generates an asset to a beneficiary account', async () => {
      await registry.generate(
        alternativeAsset.id,
        anotherUser,
        alternativeAsset.data,
        sentByUser
      )
      const assetOwner = await registry.holderOf(alternativeAsset.id)
      assetOwner.should.be.equal(anotherUser)
    })
  })

  describe('destroy', () => {
    it('destroys an asset created', async () => {
      await registry.generate(
        alternativeAsset.id,
        creator,
        alternativeAsset.data,
        sentByCreator
      )
      let exist = await registry.exists(alternativeAsset.id)
      exist.should.be.true
      await registry.destroy(alternativeAsset.id)
      exist = await registry.exists(alternativeAsset.id)
      exist.should.be.false
    })

    it('emits a Transfer(0) event', async () => {
      await registry.generate(
        alternativeAsset.id,
        creator,
        alternativeAsset.data,
        sentByCreator
      )
      const { logs } = await registry.destroy(alternativeAsset.id)
      logs.length.should.be.equal(1)
      checkDestroyLog(logs[0], creator, alternativeAsset.id, creator)
    })

    it('tries to get data from asset already destroyed', async () => {
      await registry.generate(
        alternativeAsset.id,
        creator,
        alternativeAsset.data,
        sentByCreator
      )
      await registry.destroy(alternativeAsset.id)
      await assertRevert(registry.assetData(alternativeAsset.id))
    })

    it('tries to destroy a not-existed asset', async () => {
      await assertRevert(registry.destroy(alternativeAsset.id))
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

    it('returns false for a nonexistent address', async () => {
      const isContract = await registry.isContractProxy(NONE)
      isContract.should.equal(false)
    })
  })

  describe('authorizations getters', () => {
    it('is authorized', async () => {
      const authorized = true
      await registry.authorizeOperator(user, authorized)
      const isAuthorized = await registry.isOperatorAuthorizedFor(user, creator)
      isAuthorized.should.equal(authorized)
    })

    it('emits AuthorizeOperator events', async () => {
      const authorized = true
      const { logs } = await registry.authorizeOperator(user, authorized)
      logs.length.should.be.equal(1)
      checkAuthorizationLog(logs[0], user, creator, authorized)
    })

    it('is not authorized after setting the operator as false', async () => {
      await registry.authorizeOperator(user, true)
      await registry.authorizeOperator(user, false)
      const isAuthorized = await registry.isOperatorAuthorizedFor(user, creator)
      isAuthorized.should.equal(false)
    })

    it('is not authorized even if the holder is not set as operator', async () => {
      const isAuthorized = await registry.isOperatorAuthorizedFor(
        creator,
        creator
      )
      isAuthorized.should.equal(false)
    })

    it('is not authorized', async () => {
      const isAuthorized = await registry.isOperatorAuthorizedFor(creator, user)
      isAuthorized.should.equal(false)
    })

    it('reverts when removing a un-existing operator', async () => {
      const authorized = false
      await assertRevert(registry.authorizeOperator(user, authorized))
    })

    it('reverts when trying to add an existing operator', async () => {
      const authorized = true
      await registry.authorizeOperator(user, authorized)
      await assertRevert(registry.authorizeOperator(user, authorized))
    })

    it('reverts when removing a previous removed operator', async () => {
      const authorized = true
      await registry.authorizeOperator(user, authorized)
      await registry.authorizeOperator(user, !authorized)
      await assertRevert(registry.authorizeOperator(user, !authorized))
    })
  })

  describe('update', () => {
    it('updates the asset with new data', async () => {
      await registry.update(0, 'new data')
      const data = await registry.assetData(0)
      data.should.equal('new data')
    })

    it('reverts for a nonexistent asset', async () => {
      await assertRevert(registry.update(10, 'new data'))
    })

    it('emits an Update event', async () => {
      const { logs } = await registry.update(0, 'new data')
      logs.length.should.be.equal(1)
      checkUpdateLog(logs[0], 0, creator, creator)
    })
  })
})
