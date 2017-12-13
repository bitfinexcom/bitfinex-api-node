/* eslint-env mocha */
'use strict'

const assert = require('assert')
const { OrderBook } = require('../../../lib/models')

describe('OrderBook model', () => {
  it('constructor: integrates snapshot', () => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)

    assert.deepEqual(ob.bids, [entries[0]])
    assert.deepEqual(ob.asks, [entries[1]])
  })

  it('updateWith: emits an error if removing an unknown price level', (done) => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)

    ob.on('error', (err) => {
      assert(err.message.indexOf('unknown price') !== -1)
      done()
    })

    ob.updateWith([300, 0, 1])
  })

  it('updateWith: correctly applies update', () => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)
    ob.updateWith([100, 3, 15])

    assert.deepEqual(ob.bids[0], [100, 3, 15])
    assert.equal(ob.bids.length, 1)

    ob.updateWith([100, 0, 1])
    assert.equal(ob.bids.length, 0)
  })

  it('updateWith: maintains sort', () => {
    const ob = new OrderBook([
      [100, 2, 10],
      [200, 2, -10]
    ])

    ob.updateWith([20, 5, 10])
    ob.updateWith([150, 5, 10])
    ob.updateWith([80, 5, 10])
    ob.updateWith([300, 5, -10])
    ob.updateWith([40, 5, 10])
    ob.updateWith([130, 5, 10])
    ob.updateWith([342, 5, -10])
    ob.updateWith([457, 5, -10])

    for (let i = 0; i < ob.bids.length - 2; i++) {
      assert(ob.bids[i][0] > ob.bids[i + 1][0])
    }

    for (let i = 0; i < ob.asks.length - 2; i++) {
      assert(ob.asks[i][0] < ob.asks[i + 1][0])
    }
  })

  it('updateWith: emits an update event', (done) => {
    const ob = new OrderBook([
      [100, 2, 10],
      [200, 2, -10]
    ])

    ob.on('update', () => {
      done()
    })

    ob.updateWith([20, 5, 10])
  })

  it('midPrice: calculates mid price', () => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)
    assert.equal(ob.midPrice(), 150)
  })

  it('getEntry: returns null for unknown entries', () => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)
    const entry = ob.getEntry(300)

    assert.equal(entry, null)
  })


  it('getEntry: returns entry even with only one OB side', () => {
    const entriesA = [[100, 2, 10]]
    const entriesB = [[200, 2, -10]]

    const obA = new OrderBook(entriesA)
    const obB = new OrderBook(entriesB)

    assert.deepEqual(obA.getEntry(100), { price: 100, count: 2, amount: 10 })
    assert.deepEqual(obB.getEntry(200), { price: 200, count: 2, amount: -10 })
  })

  it('getEntry: unserializes entry before returning', () => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)
    const entry = ob.getEntry(100)

    assert.equal(entry.price, 100)
    assert.equal(entry.count, 2)
    assert.equal(entry.amount, 10)
  })

  it('updateArrayOBWith: returns false for unknown entry', () => {
    const ob = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    assert(!OrderBook.updateArrayOBWith(ob, [300, 0, -1]))
    assert(!OrderBook.updateArrayOBWith(ob, [300, 0, 1]))
  })

  it('updateArrayOBWith: correctly applies update', () => {
    const ob = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    OrderBook.updateArrayOBWith(ob, [100, 0, 1])
    OrderBook.updateArrayOBWith(ob, [150, 1, 16])
    OrderBook.updateArrayOBWith(ob, [200, 7, -42])
    OrderBook.updateArrayOBWith(ob, [121, 3, 14])
    OrderBook.updateArrayOBWith(ob, [300, 1, -4])

    assert.deepEqual(ob, [
      [300, 1, -4],
      [200, 7, -42],
      [150, 1, 16],
      [121, 3, 14]
    ])
  })

  it('unserialize: returns bid/asks map for snapshots', () => {
    const obData = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = OrderBook.unserialize(obData)
    assert.equal(typeof ob, 'object')
    assert.equal(Object.keys(ob).length, 2)
    assert.deepEqual(ob.bids, [{ price: 100, count: 2, amount: 10 }])
    assert.deepEqual(ob.asks, [{ price: 200, count: 2, amount: -10 }])
  })

  it('unserialiez: returns map for entries', () => {
    const entry = OrderBook.unserialize([150, 0, -1])

    assert.deepEqual(entry, {
      price: 150,
      count: 0,
      amount: -1
    })
  })
})
