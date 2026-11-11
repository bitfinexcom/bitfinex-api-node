'use strict'

const test = require('brittle')

const { isSnapshot } = require('../../../lib/util')

test('isSnapshot - detects snapshots by data structure', async (t) => {
  await t.test('returns false for heartbeats', (t) => {
    t.is(isSnapshot(['hb']), false)
  })

  await t.test('returns false simple lists (data updates)', (t) => {
    t.is(isSnapshot([1337]), false)
  })

  await t.test('returns true for nested lists (snapshots)', (t) => {
    t.is(isSnapshot([['a'], ['b']]), true)
  })
})
