/* eslint-env mocha */
'use strict'

const assert = require('assert')
const { MarginInfo } = require('../../../lib/models')

describe('MarginInfo model', () => {
  it('initializes correctly w/ sym', () => {
    const miSym = new MarginInfo([
      'sym',
      'tEOSUSD',
      [
        26912,
        51443,
        23397,
        26912
      ]
    ])

    assert.equal(miSym.type, 'sym')
    assert.equal(miSym.symbol, 'tEOSUSD')
    assert.equal(miSym.tradableBalance, 26912)
    assert.equal(miSym.grossBalance, 51443)
    assert.equal(miSym.buy, 23397)
    assert.equal(miSym.sell, 26912)
  })

  it('initializes correctly for base', () => {
    const miBase = new MarginInfo([
      'base',
      [
        -4784,
        -251,
        16392,
        11355
      ]
    ])

    assert.equal(miBase.type, 'base')
    assert.equal(miBase.userPL, -4784)
    assert.equal(miBase.userSwaps, -251)
    assert.equal(miBase.marginBalance, 16392)
    assert.equal(miBase.marginNet, 11355)
  })

  it('serializes correctly w/ sym', () => {
    const miSym = new MarginInfo([
      'sym',
      'tEOSUSD',
      [
        26912,
        51443,
        23397,
        26912
      ]
    ])

    const arr = miSym.serialize()

    assert.deepStrictEqual(arr, [
      'sym',
      'tEOSUSD',
      [
        26912,
        51443,
        23397,
        26912
      ]
    ])
  })

  it('serializes correctly for base', () => {
    const miBase = new MarginInfo([
      'base',
      [
        -4784,
        -251,
        16392,
        11355
      ]
    ])

    const arr = miBase.serialize()
    assert.deepStrictEqual(arr, [
      'base',
      [
        -4784,
        -251,
        16392,
        11355
      ]
    ])
  })

  it('unserializes correctly w/ sym', () => {
    const obj = MarginInfo.unserialize([
      'sym',
      'tEOSUSD',
      [
        26912,
        51443,
        23397,
        26912
      ]
    ])

    assert.equal(obj.type, 'sym')
    assert.equal(obj.symbol, 'tEOSUSD')
    assert.equal(obj.tradableBalance, 26912)
    assert.equal(obj.grossBalance, 51443)
    assert.equal(obj.buy, 23397)
    assert.equal(obj.sell, 26912)
  })

  it('unserializes correctly for base', () => {
    const obj = MarginInfo.unserialize([
      'base',
      [
        -4784,
        -251,
        16392,
        11355
      ]
    ])

    assert.equal(obj.type, 'base')
    assert.equal(obj.userPL, -4784)
    assert.equal(obj.userSwaps, -251)
    assert.equal(obj.marginBalance, 16392)
    assert.equal(obj.marginNet, 11355)
  })
})
