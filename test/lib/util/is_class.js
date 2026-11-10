'use strict'

const test = require('brittle')
const { TradingTicker } = require('bfx-api-node-models')
const { isClass } = require('../../../lib/util')

test('isClass', async (t) => {
  await t.test('returns true for classes', (t) => {
    t.ok(isClass(TradingTicker))
  })

  await t.test('returns false for functions', (t) => {
    t.ok(!isClass(() => {}))
  })

  await t.test('returns false for class instances', (t) => {
    const ticker = new TradingTicker()
    t.ok(!isClass(ticker))
  })

  await t.test('returns false for primitives', (t) => {
    t.ok(!isClass(42))
    t.ok(!isClass('42'))
    t.ok(!isClass({}))
    t.ok(!isClass([]))
  })
})
