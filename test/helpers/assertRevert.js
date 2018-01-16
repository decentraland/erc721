export default async promise => {
  try {
    await promise
    assert.fail('Expected revert not received')
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0
    assert(revertFound, `Expected "revert", got ${error} instead`)
  }
}

export const assertError = promise => {
  return Promise.all([
    promise.should.be.rejected
  ])
}
