import assertRevert from './helpers/assertRevert'

const BigNumber = web3.BigNumber

const StandardAssetRegistry = artifacts.require('StandardAssetRegistryTest')
const Holder = artifacts.require('Holder')
const NonHolder = artifacts.require('NonHolder')

const NONE = '0x0000000000000000000000000000000000000000'

function checkTransferLog(log, assetId, from, to) {
  log.event.should.be.eq('Transfer')
  log.args.assetId.should.be.bignumber.equal(assetId)
  log.args.from.should.be.equal(from)
  log.args.to.should.be.equal(to)
}

function checkAuthorizationLog(log, holder, operator, authorized) {
  log.event.should.be.eq('ApprovalForAll')
  log.args.operator.should.be.equal(operator)
  log.args.holder.should.be.equal(holder)
  log.args.authorized.should.be.equal(authorized)
}

function checkApproveLog(log, owner, operator, assetId) {
  log.event.should.be.eq('Approval')
  log.args.owner.should.be.equal(owner)
  log.args.operator.should.be.equal(operator)
  log.args.assetId.should.be.bignumber.equal(assetId)
}

function checkCreateLog(log, holder, assetId) {
  log.event.should.be.eq('Transfer')
  log.args.from.should.be.equal(NONE)
  log.args.to.should.be.equal(holder)
  log.args.assetId.should.be.bignumber.equal(assetId)
}

function checkDestroyLog(log, holder, assetId) {
  log.event.should.be.eq('Transfer')
  log.args.from.should.be.equal(holder)
  log.args.to.should.be.equal(NONE)
  log.args.assetId.should.be.bignumber.equal(assetId)
}

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const expect = require('chai').expect

contract('StandardAssetRegistry', accounts => {
  const [creator, user, anotherUser, operator, mallory] = accounts
  let registry = null
  const _firstAssetlId = 1
  const alternativeAsset = { id: 2, data: 'data2' }
  const sentByCreator = { from: creator }
  const sentByUser = { from: user }
  const creationParams = {
    gas: 4e6,
    gasPrice: 21e9,
    from: creator
  }

  beforeEach(async () => {
    registry = await StandardAssetRegistry.new(creationParams)
    await registry.generate(0, creator)
    await registry.generate(1, creator)
  })

  describe('Global Setters', () => {
    describe('totalSupply', () => {
      it('has a total supply equivalent to the inital supply', async () => {
        const totalSupply = await registry.totalSupply()
        totalSupply.should.be.bignumber.equal(2)
      })
      it('has a total supply that increases after creating a new registry', async () => {
        let totalSupply = await registry.totalSupply()
        totalSupply.should.be.bignumber.equal(2)
        await registry.generate(100, creator, sentByCreator)
        totalSupply = await registry.totalSupply()
        totalSupply.should.be.bignumber.equal(3)
      })
    })

    describe('decimals', () => {
      it('returns 0', async () => {
        const decimals = await registry.decimals()
        decimals.should.be.bignumber.equal(0)
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

  describe('ownerOf', () => {
    it('should match the holder of the asset', async () => {
      const one = creator
      const two = NONE
      const outputOne = await registry.ownerOf(1)
      const outputTwo = await registry.ownerOf(2)
      outputOne.should.be.equal(one)
      outputTwo.should.be.equal(two)
    })
    it('throws if not valid id', async () => {
      return Promise.all([registry.ownerOf(true).should.be.rejected])
    })
    it('throws if id is not provided', async () => {
      return Promise.all([registry.ownerOf().should.be.rejected])
    })
  })

  describe('balanceOf', () => {
    it('has an amount of assets equivalent to the created assets', async () => {
      const balanceOf = await registry.balanceOf(creator)
      balanceOf.should.be.bignumber.equal(2)
    })

    it('has an amount of assets equivalent to the amount sent to the beneficiary', async () => {
      await registry.generate(3, user, sentByCreator)
      const balanceOf = await registry.balanceOf(user)
      balanceOf.should.be.bignumber.equal(1)
    })

    it('should consider destroyed assets', async () => {
      await registry.destroy(1)
      const balanceOf = await registry.balanceOf(creator)
      balanceOf.should.be.bignumber.equal(1)
    })

    it('should return 0 for a nonexistent address', async () => {
      const balanceOf = await registry.balanceOf(NONE)
      balanceOf.should.be.bignumber.equal(0)
    })
  })

  describe('tokenOfOwnerByIndex', () => {
    it('returns the id for the first asset of the holder', async () => {
      const assets = await registry.tokenOfOwnerByIndex(creator, 0)
      assets.should.be.bignumber.equal(0)
    })

    it('reverts if the index is out of bounds', async () => {
      await assertRevert(registry.tokenOfOwnerByIndex(creator, 10))
    })

    it('reverts if the index is out of bounds (negative)', async () => {
      await assertRevert(registry.tokenOfOwnerByIndex(creator, -10))
    })

    it('fails for a nonexistent address', async () => {
      await assertRevert(registry.tokenOfOwnerByIndex(NONE, 0))
    })
  })

  describe('tokensOf', () => {
    it('returns the created assets', async () => {
      const assets = await registry.tokensOf(creator)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members(['0', '1'])
    })

    it('returns an empty array for an address with no assets', async () => {
      const assets = await registry.tokensOf(user)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members([])
    })

    it('returns an empty array for a nonexistent address', async () => {
      const assets = await registry.tokensOf(NONE)
      const convertedAssets = assets.map(big => big.toString())
      convertedAssets.should.have.all.members([])
    })
  })

  describe('transferFrom', () => {
    it('ensures the asset is passed to another owner after transfer', async () => {
      await registry.generate(3, creator, { from: creator })
      await registry.transferFrom(creator, anotherUser, 3)
      const newOwner = await registry.ownerOf(3)
      newOwner.should.be.equal(anotherUser)
    })
    it('ensures the sender owns the asset that is trying to send', async () => {
      await registry.generate(4, anotherUser, {
        from: anotherUser
      })
      await assertRevert(registry.transferFrom(creator, operator, 4))
    })
    it("after receiving an asset, the receiver can't transfer the sender's other assets", async () => {
      await registry.generate(5, creator, { from: creator })
      await registry.transferFrom(creator, user, 5)
      await assertRevert(registry.transferFrom(creator, anotherUser, 5))
      await assertRevert(registry.transferFrom(creator, operator, 5))
      await assertRevert(registry.transferFrom(creator, mallory, 5))
      const newOwner = await registry.ownerOf(5)
      newOwner.should.be.equal(user)
    })
    it('throws if no arguments are sent', async () => {
      return Promise.all([registry.transferFrom().should.be.rejected])
    })
    it('throws if asset is missing', async () => {
      return Promise.all([
        registry.transferFrom(anotherUser).should.be.rejected
      ])
    })
    it('throws if asset is to transfer is missing', async () => {
      return Promise.all([registry.transferFrom(null, 1).should.be.rejected])
    })
    const clear = ''
    it('works only if operator', async () => {
      await registry.generate(7, anotherUser, { from: creator })
      await registry.setApprovalForAll(creator, true, { from: anotherUser })
      await registry.transferFrom(anotherUser, user, 7, {
        from: creator
      })
    })
    it('reverts when trying to transfer and To address is the same as the holder address', async () => {
      await registry.generate(7, anotherUser, { from: creator })
      await assertRevert(
        registry.transferFrom(anotherUser, anotherUser, 7, {
          from: anotherUser
        })
      )
    })
    it('reverts if receiver is null', async () => {
      await registry.generate(8, creator, { from: creator })
      await assertRevert(
        registry.transferFrom(creator, NONE, 8, { from: creator })
      )
    })
  })
  describe('transferFrom', () => {
    it('ensures the asset is owned by from', async () => {
      await registry.generate(3, creator, { from: creator })
      await registry.transferFrom(creator, anotherUser, 3)
      const newOwner = await registry.ownerOf(3)
      newOwner.should.be.equal(anotherUser)
    })
  })

  describe('transfer security', () => {
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
      await registry.generate(asset, creator, { from: creator })
      await registry.safeTransfer(creator, holder.address, asset, USER_DATA, {
        from: creator
      })
      const newOwner = await registry.ownerOf(asset)
      newOwner.should.be.equal(holder.address)
    })

    it('event is created', async () => {
      const asset = 101
      await registry.generate(asset, creator, { from: creator })
      const { logs } = await registry.safeTransfer(
        creator,
        holder.address,
        asset,
        USER_DATA,
        { from: creator }
      )
      checkTransferLog(logs[0], asset, creator, holder.address)
    })

    it('non holder does not receive the token', async () => {
      const asset = 100
      await registry.generate(asset, creator, { from: creator })
      await assertRevert(
        registry.safeTransfer(creator, nonHolder.address, asset, USER_DATA, {
          from: creator
        })
      )
    })
  })

  describe('generate', () => {
    it('emits a Create event', async () => {
      const { logs } = await registry.generate(
        alternativeAsset.id,
        user,
        sentByUser
      )
      logs.length.should.be.equal(1)
      checkCreateLog(logs[0], user, alternativeAsset.id, user)
    })

    it('fails if the assetId is already in use', async () => {
      await registry.generate(alternativeAsset.id, user, sentByUser)
      await assertRevert(
        registry.generate(alternativeAsset.id, user, sentByUser)
      )
    })

    it('generates an asset to a beneficiary account', async () => {
      await registry.generate(alternativeAsset.id, anotherUser, sentByUser)
      const assetOwner = await registry.ownerOf(alternativeAsset.id)
      assetOwner.should.be.equal(anotherUser)
    })
  })

  describe('destroy', () => {
    it('destroys an asset created', async () => {
      await registry.generate(alternativeAsset.id, creator, sentByCreator)
      let exist = await registry.exists(alternativeAsset.id)
      exist.should.be.true
      await registry.destroy(alternativeAsset.id)
      exist = await registry.exists(alternativeAsset.id)
      exist.should.be.false
    })

    it('emits a Transfer(0) event', async () => {
      await registry.generate(alternativeAsset.id, creator, sentByCreator)
      const { logs } = await registry.destroy(alternativeAsset.id)
      logs.length.should.be.equal(1)
      checkDestroyLog(logs[0], creator, alternativeAsset.id, creator)
    })

    it('tries to destroy a non-existant asset', async () => {
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

  describe('authorization', () => {
    it('is authorized', async () => {
      const authorized = true
      await registry.setApprovalForAll(user, authorized)
      const isAuthorized = await registry.isApprovedForAll(creator, user)
      isAuthorized.should.equal(authorized)
    })

    it('emits AuthorizeOperator events', async () => {
      const authorized = true
      const { logs } = await registry.setApprovalForAll(user, authorized)
      logs.length.should.be.equal(1)
      checkAuthorizationLog(logs[0], creator, user, authorized)
    })

    it('is not authorized after setting the operator as false', async () => {
      await registry.setApprovalForAll(user, true)
      await registry.setApprovalForAll(user, false)
      const isAuthorized = await registry.isApprovedForAll(creator, user)
      isAuthorized.should.equal(false)
    })

    it('is not authorized even if the holder is not set as operator', async () => {
      const isAuthorized = await registry.isApprovedForAll(creator, creator)
      isAuthorized.should.equal(false)
    })

    it('is not authorized', async () => {
      const isAuthorized = await registry.isApprovedForAll(user, creator)
      isAuthorized.should.equal(false)
    })

    it('reverts when removing a un-existing operator', async () => {
      const authorized = false
      await assertRevert(registry.setApprovalForAll(user, authorized))
    })

    it('reverts when trying to add an existing operator', async () => {
      const authorized = true
      await registry.setApprovalForAll(user, authorized)
      await assertRevert(registry.setApprovalForAll(user, authorized))
    })

    it('reverts when removing a previous removed operator', async () => {
      const authorized = true
      await registry.setApprovalForAll(user, authorized)
      await registry.setApprovalForAll(user, !authorized)
      await assertRevert(registry.setApprovalForAll(user, !authorized))
    })

    it('getApprovedAddress should return approved address', async () => {
      await registry.approve(operator, 1)
      const approvedAddress = await registry.getApprovedAddress(1)
      approvedAddress.should.be.equal(operator)
    })

    it('should throw if user trying to approve is not holder', async () => {
      await assertRevert(registry.approve(mallory, 0, { from: anotherUser }))
    })

    it('should approve single asset for an operator', async () => {
      await registry.approve(operator, 0)

      const approved = await registry.isAuthorized(operator, 0)
      approved.should.be.true

      const notapproved = await registry.isAuthorized(operator, 1)
      notapproved.should.be.false
    })

    it('should approve single asset for an operator if given authorization', async () => {
      await registry.approve(operator, 0)
      const approved = await registry.isAuthorized(operator, 0)
      approved.should.be.true
    })

    it('approve should throw if holder = operator', async () => {
      await assertRevert(registry.approve(creator, 0))
    })

    it('approve emits Approve event', async () => {
      const assetId = new BigNumber(1)
      const { logs } = await registry.approve(operator, assetId)
      logs.length.should.be.equal(1)
      checkApproveLog(logs[0], creator, operator, assetId)
    })

    it('isAuthorized should throw if operator is 0', async () => {
      await assertRevert(registry.isAuthorized(0, 0))
    })

    it('should clean operators after transfer', async () => {
      // Approve operator
      await registry.approve(operator, 0)
      let approved = await registry.isAuthorized(operator, 0)
      approved.should.be.true

      // Transfer form creator to anotherUser
      await registry.safeTransferFrom(creator, anotherUser, 0)
      const newOwner = await registry.ownerOf(0)
      newOwner.should.be.equal(anotherUser)

      // Check if authorization is clear
      approved = await registry.isAuthorized(operator, 0)
      approved.should.be.false

      // Transfer from anotherUser to creator sended by operator
      await assertRevert(
        registry.safeTransferFrom(newOwner, creator, 0, { from: operator })
      )
    })

    it('should not allow old token owner approvedForAll accounts to operate', async () => {
      // Approve operator
      await registry.setApprovalForAll(operator, true)
      let approved = await registry.isAuthorized(operator, 0)
      approved.should.be.true
      let isAuthorized = await registry.isApprovedForAll(creator, operator)
      isAuthorized.should.be.true

      // Transfer form creator to anotherUser
      await registry.safeTransferFrom(creator, anotherUser, 0)
      const newOwner = await registry.ownerOf(0)
      newOwner.should.be.equal(anotherUser)

      // Check if authorizations are as expected
      approved = await registry.isAuthorized(operator, 0)
      approved.should.be.false
      isAuthorized = await registry.isApprovedForAll(creator, operator)
      isAuthorized.should.be.true

      // Transfer from anotherUser to creator sended by operator
      await assertRevert(
        registry.safeTransferFrom(newOwner, creator, 0, { from: operator })
      )
    })
  })

  describe('eip165 interfaces', () => {
    it('supports 165 interface', async () => {
      const result = await registry.supportsInterface('0x01ffc9a7')
      result.should.be.true
    })

    it('supports 821 interface', async () => {
      const result = await registry.supportsInterface('0x7c0633c6')
      result.should.be.true
    })

    it('supports ERC721 standard interface', async () => {
      const result = await registry.supportsInterface('0x80ac58cd')
      result.should.be.true
    })
  })
})
