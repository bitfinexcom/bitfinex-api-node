/* eslint-env mocha */

'use strict'
const PORT = 1337

const assert = require('assert')

const WebSocket = require('ws')
const Bfx = require('../index.js')

describe('websocket1 parsing non json', () => {
  it('should not crash the client', (done) => {
    const bws = new Bfx('dummy', 'dummy', { version: 1, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`

    bws.open()

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

    bws.on('open', () => {
      bws.subscribeOrderBook('BTCUSD', 'R0')
    })
  })
})
