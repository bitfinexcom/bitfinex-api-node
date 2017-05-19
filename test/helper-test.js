/* eslint-env mocha */

'use strict'

const assert = require('assert')

const { isSnapshot } = require('../lib/helper.js')

describe('isSnapshot - detects snapshots by data structure', () => {
  it('returns false for heartbeats', () => {
    assert.equal(isSnapshot(['hb']), false)
  })

  it('returns false simple lists (data updates)', () => {
    assert.equal(isSnapshot([1337]), false)
  })

  it('returns true for nested lists (snapshots)', () => {
    assert.equal(isSnapshot([['a'], ['b']]), true)
  })
})
