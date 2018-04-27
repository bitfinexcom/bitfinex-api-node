/* eslint-env mocha */
'use strict'

const assert = require('assert')
const { TradingTicker } = require('../../../lib/models')
const { isClass } = require('../../../lib/util')

describe('isClass', () => {
  it('returns true for classes', () => {
    assert(isClass(TradingTicker))
  })

  it('returns false for functions', () => {
    assert(!isClass(() => {}))
  })

  it('returns false for class instances', () => {
    const t = new TradingTicker()
    assert(!isClass(t))
  })

  it('returns false for primitives', () => {
    assert(!isClass(42))
    assert(!isClass('42'))
    assert(!isClass({}))
    assert(!isClass([]))
  })
})
