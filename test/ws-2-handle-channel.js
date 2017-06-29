/* eslint-env mocha */

'use strict'

const assert = require('assert')

const BfxWs = require('../ws2.js')
const transformer = require('../lib/transformer.js')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const bfxWs = new BfxWs(
  API_KEY,
  API_SECRET
)

const stubOrderbookSnapshot = require('./fixtures/response-ws2-server-order-book-P1.json')
const stubTradesSnapshot = require('./fixtures/response-ws2-server-trades.json')

describe('channel msg handling', () => {
  it('orders: sends snapshots as one array', (done) => {
    bfxWs.channelMap = {
      31: { channel: 'book', prec: 'P1' }
    }

    bfxWs.once('orderbook', (symbol, data) => {
      assert.deepEqual(data[0], [ 1779, 1, 42.11518492 ])
      done()
    })

    bfxWs.handleChannel(stubOrderbookSnapshot)
  })

  it('orders: sends updates as lists', (done) => {
    bfxWs.channelMap = {
      31: { channel: 'book', prec: 'P1' }
    }

    bfxWs.once('orderbook', (symbol, data) => {
      assert.deepEqual(data, [ 1337, 4, 42.11518492 ])
      done()
    })

    bfxWs.handleChannel([ 31, [ 1337, 4, 42.11518492 ] ])
  })

  it('transforms & normalizes well - R0 update', (done) => {
    const bfxWs = new BfxWs(
      API_KEY,
      API_SECRET,
      {
        transformer: transformer
      }
    )

    bfxWs.channelMap = {
      3689: { channel: 'book', prec: 'R0', symbol: 'tBTCUSD' }
    }

    bfxWs.once('orderbook', (symbol, data) => {
      assert.deepEqual(data, { PRICE: 2478.9, ORDER_ID: 2918983235, AMOUNT: 0.9567 })
      done()
    })

    bfxWs.handleChannel([ 3689, [ 2918983235, 2478.9, 0.9567 ] ])
  })

  it('transforms & normalizes well - R0 snap', (done) => {
    const bfxWs = new BfxWs(
      API_KEY,
      API_SECRET,
      {
        transformer: transformer
      }
    )

    bfxWs.channelMap = {
      20182: { channel: 'book', prec: 'R0', symbol: 'tBTCUSD' }
    }

    bfxWs.once('orderbook', (symbol, data) => {
      assert.deepEqual(
        data[1],
        { ORDER_ID: 2919063691, PRICE: 2490.7, AMOUNT: 1.05 }
      )
      done()
    })

    const snap = [ 20182, [
      [ 2919056741, 2490.7, 0.40589954 ],
      [ 2919063691, 2490.7, 1.05 ],
      [ 2919063457, 2490, 0.40589954 ]
    ] ]
    bfxWs.handleChannel(snap)
  })

  it('transforms & normalizes well - P1 snap', (done) => {
    const bfxWs = new BfxWs(
      API_KEY,
      API_SECRET,
      {
        transformer: transformer
      }
    )

    bfxWs.channelMap = {
      59: { channel: 'book', prec: 'P1', symbol: 'tBTCUSD' }
    }

    bfxWs.once('orderbook', (symbol, data) => {
      assert.deepEqual(
        data[1],
        { COUNT: 2, PRICE: 2487, AMOUNT: 1.758 }
      )
      done()
    })

    const snap = [ 59, [
      [ 2488, 3, 7.46372448 ],
      [ 2487, 2, 1.758 ],
      [ 2486, 1, 0.99 ]
    ]]
    bfxWs.handleChannel(snap)
  })

  it('transforms & normalizes well - P1 update', (done) => {
    const bfxWs = new BfxWs(
      API_KEY,
      API_SECRET,
      {
        transformer: transformer
      }
    )

    bfxWs.channelMap = {
      59: { channel: 'book', prec: 'P1', symbol: 'tBTCUSD' }
    }

    bfxWs.once('orderbook', (symbol, data) => {
      assert.deepEqual(
        data,
        { PRICE: 2475, COUNT: 6, AMOUNT: 17.82372471 }
      )
      done()
    })

    bfxWs.handleChannel([ 59, [ 2475, 6, 17.82372471 ] ])
  })

  it('trades: sends snapshots as one nested array', (done) => {
    bfxWs.channelMap = {
      31: { channel: 'trades' }
    }

    bfxWs.once('trade', (symbol, data) => {
      assert.deepEqual(data[0], [32288059, 1494971706000, -0.00042864, 1773.9])
      done()
    })

    bfxWs.handleChannel(stubTradesSnapshot)
  })

  it('trades: sends snapshots as simple list (te)', (done) => {
    bfxWs.channelMap = {
      31: { channel: 'trades' }
    }

    bfxWs.once('trade', (symbol, data) => {
      assert.deepEqual(data, ['te', [32288069, 1494971734000, 0.28, 1774]])
      done()
    })

    bfxWs.handleChannel([31, 'te', [32288069, 1494971734000, 0.28, 1774]])
  })

  it('trades: sends snapshots as simple list (tu)', (done) => {
    bfxWs.channelMap = {
      31: { channel: 'trades' }
    }

    bfxWs.once('trade', (symbol, data) => {
      assert.deepEqual(data, ['tu', [32288069, 1494971734000, 0.28, 1774]])
      done()
    })

    bfxWs.handleChannel([31, 'tu', [32288069, 1494971734000, 0.28, 1774]])
  })
})
