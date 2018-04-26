/* eslint-env mocha */
'use strict'

const assert = require('assert')
const CRC = require('crc-32')
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

  it('topBid/topAsk: returns the top bid/ask, or null', () => {
    const ob = new OrderBook([
      [140, 1, 10],
      [145, 1, 10],
      [148, 1, 10],
      [149, 1, 10],
      [151, 1, -10],
      [152, 1, -10],
      [158, 1, -10],
      [160, 1, -10]
    ])

    assert.equal(ob.topBid(), 149)
    assert.equal(ob.topAsk(), 151)
  })

  it('topBidLevel/topAskLevel: returns the top bid/ask levels, or null', () => {
    const ob = new OrderBook([
      [140, 1, 10],
      [145, 1, 10],
      [148, 1, 10],
      [149, 1, 10],
      [151, 1, -10],
      [152, 1, -10],
      [158, 1, -10],
      [160, 1, -10]
    ])

    assert.deepEqual(ob.topBidLevel(), [149, 1, 10])
    assert.deepEqual(ob.topAskLevel(), [151, 1, -10])
  })

  it('checksum: returns expected value for normal OB', () => {
    const ob = new OrderBook({
      bids: [[6000, 1, 1], [5900, 1, 2]],
      asks: [[6100, 1, -3], [6200, 1, -4]]
    })

    assert.equal(ob.checksum(), CRC.str('6000:1:6100:-3:5900:2:6200:-4'))
  })

  it('checksum: returns expected value for raw OB', () => {
    const ob = new OrderBook({
      bids: [[100, 6000, 1], [101, 6000, 2]], // first field is order ID here
      asks: [[102, 6100, -3], [103, 6100, -4]]
    }, true)

    assert.equal(ob.checksum(), CRC.str('100:1:102:-3:101:2:103:-4'))
  })

  it('checksumArr: returns expected value for normal OB', () => {
    const ob = [
      [6000, 1, 1],
      [5900, 1, 2],
      [6100, 1, -3],
      [6200, 1, -4]
    ]

    assert.equal(
      OrderBook.checksumArr(ob),
      CRC.str('6000:1:6100:-3:5900:2:6200:-4')
    )
  })

  it('checksumArr: returns expected value for raw OB', () => {
    const ob = [
      [100, 6000, 1],
      [101, 6000, 2],
      [102, 6100, -3],
      [103, 6100, -4]
    ]

    assert.equal(
      OrderBook.checksumArr(ob, true),
      CRC.str('100:1:102:-3:101:2:103:-4')
    )
  })

  it('updateWith: correctly applies update', () => {
    const entries = [
      [100, 2, 10],
      [200, 2, -10]
    ]

    const ob = new OrderBook(entries)
    assert(ob.updateWith([100, 3, 15])) // update bid
    assert(ob.updateWith([200, 3, -15])) // update ask

    assert.deepEqual(ob.bids, [[100, 3, 15]])
    assert.deepEqual(ob.asks, [[200, 3, -15]])

    assert(ob.updateWith([100, 0, 15])) // remove bid
    assert(ob.updateWith([200, 0, -15])) // remove ask

    assert.equal(ob.bids.length, 0)
    assert.equal(ob.asks.length, 0)

    assert(ob.updateWith([150, 1, 2])) // add bid
    assert(ob.updateWith([100, 1, 1])) // add bid
    assert(ob.updateWith([160, 1, 3])) // add bid

    assert(ob.updateWith([161, 1, -3])) // add ask
    assert(ob.updateWith([200, 1, -1])) // add ask
    assert(ob.updateWith([175, 1, -2])) // add ask

    assert.equal(ob.bids.length, 3)
    assert.equal(ob.asks.length, 3)

    assert.deepEqual(ob.bids, [
      [160, 1, 3],
      [150, 1, 2],
      [100, 1, 1]
    ])

    assert.deepEqual(ob.asks, [
      [161, 1, -3],
      [175, 1, -2],
      [200, 1, -1]
    ])

    assert(ob.updateWith([160, 2, 4])) // update top bid
    assert.deepEqual(ob.bids, [
      [160, 2, 4],
      [150, 1, 2],
      [100, 1, 1]
    ])

    assert(ob.updateWith([150, 0, 2])) // remove middle bid
    assert.deepEqual(ob.bids, [
      [160, 2, 4],
      [100, 1, 1]
    ])

    assert(ob.updateWith([159, 1, 42])) // insert middle bid
    assert.deepEqual(ob.bids, [
      [160, 2, 4],
      [159, 1, 42],
      [100, 1, 1]
    ])

    assert(ob.updateWith([159.9, 2, 7])) // insert another bid
    assert.deepEqual(ob.bids, [
      [160, 2, 4],
      [159.9, 2, 7],
      [159, 1, 42],
      [100, 1, 1]
    ])

    assert.deepEqual(ob.asks, [ // verify asks
      [161, 1, -3],
      [175, 1, -2],
      [200, 1, -1]
    ])

    assert(ob.updateWith([161, 2, -4])) // update top ask
    assert.deepEqual(ob.asks, [
      [161, 2, -4],
      [175, 1, -2],
      [200, 1, -1]
    ])

    assert(ob.updateWith([175, 0, -2])) // remove middle ask
    assert.deepEqual(ob.asks, [
      [161, 2, -4],
      [200, 1, -1]
    ])

    assert(ob.updateWith([175, 1, -42])) // insert middle ask
    assert.deepEqual(ob.asks, [
      [161, 2, -4],
      [175, 1, -42],
      [200, 1, -1]
    ])

    assert(ob.updateWith([170, 2, -7])) // insert another ask
    assert.deepEqual(ob.asks, [
      [161, 2, -4],
      [170, 2, -7],
      [175, 1, -42],
      [200, 1, -1]
    ])

    assert.deepEqual(ob.bids, [ // verify bids
      [160, 2, 4],
      [159.9, 2, 7],
      [159, 1, 42],
      [100, 1, 1]
    ])
  })

  it('updateWith: correctly applies update (raw books)', () => {
    let _id = Date.now()
    const id = () => _id++
    const idBidA = id()
    const idBidB = id()
    const idBidC = id()
    const idBidD = id()
    const idBidE = id()
    const idBidF = id()

    const idAskA = id()
    const idAskB = id()
    const idAskC = id()
    const idAskD = id()
    const idAskE = id()
    const idAskF = id()

    const entries = [
      [idBidA, 100, 10],
      [idAskA, 200, -10]
    ]

    const ob = new OrderBook(entries, true)
    assert(ob.updateWith([idBidA, 100, 15])) // update bid
    assert(ob.updateWith([idAskA, 200, -15])) // update ask

    assert.deepEqual(ob.bids, [[idBidA, 100, 15]])
    assert.deepEqual(ob.asks, [[idAskA, 200, -15]])

    assert(ob.updateWith([idBidA, 0, 15])) // remove bid
    assert(ob.updateWith([idAskA, 0, -15])) // remove ask

    assert.equal(ob.bids.length, 0)
    assert.equal(ob.asks.length, 0)

    assert(ob.updateWith([idBidC, 150, 2])) // add bid
    assert(ob.updateWith([idBidB, 100, 1])) // add bid
    assert(ob.updateWith([idBidD, 160, 3])) // add bid

    assert(ob.updateWith([idAskD, 161, -3])) // add ask
    assert(ob.updateWith([idAskB, 200, -1])) // add ask
    assert(ob.updateWith([idAskC, 175, -2])) // add ask

    assert.equal(ob.bids.length, 3)
    assert.equal(ob.asks.length, 3)

    assert.deepEqual(ob.bids, [
      [idBidD, 160, 3],
      [idBidC, 150, 2],
      [idBidB, 100, 1]
    ])

    assert.deepEqual(ob.asks, [
      [idAskD, 161, -3],
      [idAskC, 175, -2],
      [idAskB, 200, -1]
    ])

    assert(ob.updateWith([idBidD, 160, 4])) // update top bid
    assert.deepEqual(ob.bids, [
      [idBidD, 160, 4],
      [idBidC, 150, 2],
      [idBidB, 100, 1]
    ])

    assert(ob.updateWith([idBidC, 0, 2])) // remove middle bid
    assert.deepEqual(ob.bids, [
      [idBidD, 160, 4],
      [idBidB, 100, 1]
    ])

    assert(ob.updateWith([idBidE, 159, 42])) // insert middle bid
    assert.deepEqual(ob.bids, [
      [idBidD, 160, 4],
      [idBidE, 159, 42],
      [idBidB, 100, 1]
    ])

    assert(ob.updateWith([idBidF, 159.9, 7])) // insert another bid
    assert.deepEqual(ob.bids, [
      [idBidD, 160, 4],
      [idBidF, 159.9, 7],
      [idBidE, 159, 42],
      [idBidB, 100, 1]
    ])

    assert.deepEqual(ob.asks, [ // verify asks
      [idAskD, 161, -3],
      [idAskC, 175, -2],
      [idAskB, 200, -1]
    ])

    assert(ob.updateWith([idAskD, 161, -4])) // update top ask
    assert.deepEqual(ob.asks, [
      [idAskD, 161, -4],
      [idAskC, 175, -2],
      [idAskB, 200, -1]
    ])

    assert(ob.updateWith([idAskC, 0, -2])) // remove middle ask
    assert.deepEqual(ob.asks, [
      [idAskD, 161, -4],
      [idAskB, 200, -1]
    ])

    assert(ob.updateWith([idAskE, 165, -42])) // insert middle ask
    assert.deepEqual(ob.asks, [
      [idAskD, 161, -4],
      [idAskE, 165, -42],
      [idAskB, 200, -1]
    ])

    assert(ob.updateWith([idAskF, 162, -7])) // insert another ask
    assert.deepEqual(ob.asks, [
      [idAskD, 161, -4],
      [idAskF, 162, -7],
      [idAskE, 165, -42],
      [idAskB, 200, -1]
    ])

    assert.deepEqual(ob.bids, [ // verify bids
      [idBidD, 160, 4],
      [idBidF, 159.9, 7],
      [idBidE, 159, 42],
      [idBidB, 100, 1]
    ])
  })

  it('updateWith: maintains sort', () => {
    const ob = new OrderBook([
      [100, 100, 10],
      [200, 200, -10]
    ])

    assert(ob.updateWith([20, 5, 10]))
    assert(ob.updateWith([150, 5, 10]))
    assert(ob.updateWith([80, 5, 10]))
    assert(ob.updateWith([300, 5, -10]))
    assert(ob.updateWith([40, 5, 10]))
    assert(ob.updateWith([130, 5, 10]))
    assert(ob.updateWith([342, 5, -10]))
    assert(ob.updateWith([457, 5, -10]))

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

    assert(ob.updateWith([20, 5, 10]))
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

    assert(OrderBook.updateArrayOBWith(ob, [100, 0, 1])) // general manipulation
    assert(OrderBook.updateArrayOBWith(ob, [150, 1, 16]))
    assert(OrderBook.updateArrayOBWith(ob, [200, 7, -42]))
    assert(OrderBook.updateArrayOBWith(ob, [121, 3, 14]))
    assert(OrderBook.updateArrayOBWith(ob, [300, 1, -4]))
    assert.deepEqual(ob, [
      [300, 1, -4],
      [200, 7, -42],
      [150, 1, 16],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [130, 1, 10])) // add middle bid
    assert.deepEqual(ob, [
      [300, 1, -4],
      [200, 7, -42],
      [150, 1, 16],
      [130, 1, 10],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [140, 1, 20])) // add another bid
    assert.deepEqual(ob, [
      [300, 1, -4],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 20],
      [130, 1, 10],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [140, 1, 42])) // update the new bid
    assert.deepEqual(ob, [
      [300, 1, -4],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 42],
      [130, 1, 10],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [130, 0, 42])) // remove a bid
    assert.deepEqual(ob, [
      [300, 1, -4],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 42],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [250, 1, -10])) // add middle ask
    assert.deepEqual(ob, [
      [300, 1, -4],
      [250, 1, -10],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 42],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [220, 1, -20])) // add another ask
    assert.deepEqual(ob, [
      [300, 1, -4],
      [250, 1, -10],
      [220, 1, -20],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 42],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [220, 1, -42])) // update the new ask
    assert.deepEqual(ob, [
      [300, 1, -4],
      [250, 1, -10],
      [220, 1, -42],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 42],
      [121, 3, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [300, 0, -4])) // remove an ask
    assert.deepEqual(ob, [
      [250, 1, -10],
      [220, 1, -42],
      [200, 7, -42],
      [150, 1, 16],
      [140, 1, 42],
      [121, 3, 14]
    ])
  })

  it('updateArrayOBWith: correctly applies update (raw books)', () => {
    let _id = Date.now()
    const id = () => _id++
    const idBidA = id()
    const idBidB = id()
    const idBidC = id()
    const idAskA = id()
    const idAskB = id()

    const ob = [
      [idBidA, 100, 10],
      [idAskA, 200, -10]
    ]

    assert(OrderBook.updateArrayOBWith(ob, [idBidA, 0, 10], true)) // general manipulation
    assert(OrderBook.updateArrayOBWith(ob, [idBidB, 150, 16], true))
    assert(OrderBook.updateArrayOBWith(ob, [idAskA, 200, -42], true))
    assert(OrderBook.updateArrayOBWith(ob, [idBidC, 121, 14], true))
    assert(OrderBook.updateArrayOBWith(ob, [idAskB, 300, -4], true))
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidC, 121, 14]
    ])

    const idBidD = id()
    assert(OrderBook.updateArrayOBWith(ob, [idBidD, 130, 10], true)) // add middle bid
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidD, 130, 10],
      [idBidC, 121, 14]
    ])

    const idBidE = id()
    assert(OrderBook.updateArrayOBWith(ob, [idBidE, 140, 20], true)) // add another bid
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 20],
      [idBidD, 130, 10],
      [idBidC, 121, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [idBidE, 140, 42], true)) // update the new bid
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 42],
      [idBidD, 130, 10],
      [idBidC, 121, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [idBidD, 0, 42], true)) // remove a bid
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 42],
      [idBidC, 121, 14]
    ])

    const idAskC = id()
    assert(OrderBook.updateArrayOBWith(ob, [idAskC, 250, -10], true)) // add middle ask
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskC, 250, -10],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 42],
      [idBidC, 121, 14]
    ])

    const idAskD = id()
    assert(OrderBook.updateArrayOBWith(ob, [idAskD, 220, -20], true)) // add another ask
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskC, 250, -10],
      [idAskD, 220, -20],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 42],
      [idBidC, 121, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [idAskD, 220, -42], true)) // update the new ask
    assert.deepEqual(ob, [
      [idAskB, 300, -4],
      [idAskC, 250, -10],
      [idAskD, 220, -42],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 42],
      [idBidC, 121, 14]
    ])

    assert(OrderBook.updateArrayOBWith(ob, [idAskB, 0, -4], true)) // remove an ask
    assert.deepEqual(ob, [
      [idAskC, 250, -10],
      [idAskD, 220, -42],
      [idAskA, 200, -42],
      [idBidB, 150, 16],
      [idBidE, 140, 42],
      [idBidC, 121, 14]
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
