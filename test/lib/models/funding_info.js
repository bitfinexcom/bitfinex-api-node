/* eslint-env mocha */
'use strict'

const assert = require('assert')
const { FundingInfo } = require('../../../lib/models')

describe('FundingInfo model', () => {
  it('initializes correctly', () => {
    const fi = new FundingInfo([
      'sym',
      'ftEOSUSD',
      [
        12,
        24,
        48,
        96
      ]
    ])

    assert.equal(fi.symbol, 'ftEOSUSD')
    assert.equal(fi.yieldLoan, 12)
    assert.equal(fi.yieldLend, 24)
    assert.equal(fi.durationLoan, 48)
    assert.equal(fi.durationLend, 96)
  })

  it('serializes correctly', () => {
    const fi = new FundingInfo([
      'sym',
      'ftEOSUSD',
      [
        12,
        24,
        48,
        96
      ]
    ])

    const arr = fi.serialize()
    assert.deepStrictEqual(arr, [
      'sym',
      'ftEOSUSD',
      [
        12,
        24,
        48,
        96
      ]
    ])
  })

  it('unserializes correctly', () => {
    const obj = FundingInfo.unserialize([
      'sym',
      'ftEOSUSD',
      [
        12,
        24,
        48,
        96
      ]
    ])

    assert.equal(obj.symbol, 'ftEOSUSD')
    assert.equal(obj.yieldLoan, 12)
    assert.equal(obj.yieldLend, 24)
    assert.equal(obj.durationLoan, 48)
    assert.equal(obj.durationLend, 96)
  })
})
