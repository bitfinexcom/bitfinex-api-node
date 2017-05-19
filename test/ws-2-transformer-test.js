/* eslint-env mocha */

'use strict'
const PORT = 1337

const assert = require('assert')

const WebSocket = require('ws')
const BFX = require('../index.js')

const stubResponseOrderbookP0 = require('./fixtures/response-ws2-server-order-book-P0.json')

describe('ws-2-transforms', () => {
  it('websocket transforming with snapshots: orderbooks', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 2, transform: true, autoOpen: false }).ws

    bws.websocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.send('{"event":"info","version":2}')
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"subscribed","channel":"book","chanId":300,"symbol":"tBTCUSD","prec":"P0","freq":"F0","len":"25","pair":"BTCUSD"}')
        ws.send(JSON.stringify(stubResponseOrderbookP0))

        // update
        ws.send(JSON.stringify([300, [1921.8, 0, 1]]))
      })
    })

    bws.on('open', () => {
      bws.subscribeOrderBook()
    })

    bws.on('orderbook', (pair, data) => {
      // snapshot
      if (Array.isArray(data)) {
        assert.deepEqual(
          data[0],
          { PRICE: 1921.8, COUNT: 1, AMOUNT: 0.17974513 }
        )
        assert.deepEqual(
          data[1],
          { PRICE: 1920.1, COUNT: 1, AMOUNT: 0.8809 }
        )

        return
      }

      // update
      assert.deepEqual(
        data,
        { PRICE: 1921.8, COUNT: 0, AMOUNT: 1 }
      )

      bws.close()
      wss.close(done)
    })
  })
})
