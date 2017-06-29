/* eslint-env mocha */

'use strict'
const PORT = 1337

const assert = require('assert')

const WebSocket = require('ws')
const BfxWs = require('../ws2.js')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

describe('websocket2 parsing non json', () => {
  it('should not crash the client', (done) => {
    const bfxWs = new BfxWs(
      API_KEY,
      API_SECRET,
      { websocketURI: `ws://localhost:${PORT}` }
    )

    bfxWs.open()

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        msg = JSON.parse(msg)
        assert.equal(msg.len, '25')
        wss.close()
        done()
      })

      ws.send("HTTP Code 408 - I'm a Tea Pot")
    })

    bfxWs.on('open', () => {
      bfxWs.subscribeOrderBook('BTCUSD', 'R0')
    })
  })
})
