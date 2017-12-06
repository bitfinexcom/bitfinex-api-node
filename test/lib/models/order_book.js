'use strict'

const assert = require('assert')
const { OrderBook } = require('../../../lib/models')

describe('OrderBook model', () => {
  describe('constructor', () => {
    it('integrates snapshot', () => {
      const entries = [
        [100, 2, 10],
        [200, 2, -10]
      ]

      const ob = new OrderBook(entries)

      assert.deepEqual(ob.bids, [entries[0]])
      assert.deepEqual(ob.asks, [entries[1]])
    })
  })

  describe('updateWith', () => {
    it('throws an error if removing an unknown price level', () => {
      const entries = [
        [100, 2, 10],
        [200, 2, -10]
      ]

      const ob = new OrderBook(entries)

      assert.throws(() => {
        ob.updateWith([300, 0, 1])
      })
    })

    it('correctly applies update', () => {
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

    it('maintains sort', () => {
      const ob = new OrderBook([
        [100, 2, 10],
        [200, 2, -10]
      ])

      ob.updateWith([20, 5, 10])
      ob.updateWith([150, 5, 10])
      ob.updateWith([80, 5, 10])
      ob.updateWith([300, 5, 10])
      ob.updateWith([40, 5, -10])
      ob.updateWith([130, 5, -10])
      ob.updateWith([342, 5, -10])

      for (let i = 0; i < ob.bids.length - 2; i++) {
        assert(ob.bids[i][0] > ob.bids[i + 1][0])
      }

      for (let i = 0; i < ob.asks.length - 2; i++) {
        assert(ob.asks[i][0] < ob.asks[i + 1][0])
      }
    })

    it('emits an update event', (done) => {
      const ob = new OrderBook([
        [100, 2, 10],
        [200, 2, -10]
      ])

      ob.on('update', () => {
        done()
      })

      ob.updateWith([20, 5, 10])
    })
  })

  describe('midPrice', () => {
    it('does what it says', () => {
      const entries = [
        [100, 2, 10],
        [200, 2, -10]
      ]

      const ob = new OrderBook(entries)
      assert.equal(ob.midPrice(), 150)
    })
  })
})