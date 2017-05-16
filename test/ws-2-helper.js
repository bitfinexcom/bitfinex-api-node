/* eslint-env mocha */

'use strict'

const assert = require('assert')

const BfxWs = require('../ws2.js')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const bfxWs = new BfxWs(
  API_KEY,
  API_SECRET
)

describe('isSnapshot - detects snapshots by data structure', () => {
  it('returns false for heartbeats', () => {
    assert.equal(bfxWs.isSnapshot(['hb']), false)
  })

  it('returns false simple lists (data updates)', () => {
    assert.equal(bfxWs.isSnapshot([[1337]]), false)
  })

  it('returns true for nested lists (snapshots)', () => {
    assert.equal(bfxWs.isSnapshot([[['a'], ['b']]]), true)
  })
})
