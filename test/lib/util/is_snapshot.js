/* eslint-env mocha */
'use strict'

const assert = require('assert')

const { isSnapshot } = require('../../../lib/util')

describe('isSnapshot - detects snapshots by data structure', () => {
  it('returns false for heartbeats', () => {
    assert.strictEqual(isSnapshot(['hb']), false)
  })

  it('returns false simple lists (data updates)', () => {
    assert.strictEqual(isSnapshot([1337]), false)
  })

  it('returns true for nested lists (snapshots)', () => {
    assert.strictEqual(isSnapshot([['a'], ['b']]), true)
  })
})
