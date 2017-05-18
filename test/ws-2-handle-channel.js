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
