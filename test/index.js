/* eslint-env mocha */

const assert = require('assert')
const BFX = require('../index')

describe('Loading Module', () => {
  describe('#BFX', () => {
    it('should be loaded', () => {
      assert.equal(typeof BFX, 'function')
    })
  })
})
