/* eslint-env mocha */

'use strict'
const PORT = 1337

const assert = require('assert')

const WebSocket = require('ws')
const BFX = require('../index.js')

const orderbookR0 = require('./fixtures/response-ws-1-orderbook-R0.json')

describe('WebSocket v1 integration', () => {
  it('plays ping pong', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"pong"}')
      })
    })

    bws.on('open', () => {
      bws.send({ event: 'ping' })
    })

    bws.on('pong', () => {
      bws.close()
      wss.close(done)
    })
  })

  it('should receive info message', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.send('{"event": "info", "version": 1.1 }')
    })

    bws.on('info', (data) => {
      assert.deepEqual(
        data,
        {
          event: 'info',
          version: 1.1
        }
      )
      bws.close()
      wss.close(done)
    })
  })

  it('should emit an error when authorization fails', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"auth","status":"FAILED","chanId":0,"code":10100,"msg":"apikey: invalid"}')
      })
    })

    bws.on('error', (err) => {
      assert.equal(err.event, 'auth')
      bws.close()
      wss.close(done)
    })

    bws.on('open', () => {
      bws.auth()
    })
  })

  it('should unsubscribe by channelId', function (done) {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        msg = JSON.parse(msg)
        if (msg.event === 'unsubscribe') {
          ws.send('{"event":"unsubscribed","status":"OK","chanId":4}')
          return
        }

        ws.send('{"event":"subscribed","channel":"ticker","chanId":4,"pair":"BTCUSD"}')
      })
    })

    bws.once('subscribed', (data) => {
      const channelId = data.chanId

      bws.once('unsubscribed', (data) => {
        assert.equal(data.status, 'OK')
        assert.equal(data.chanId, channelId)
        bws.close()
        wss.close(done)
      })
      bws.unsubscribe(channelId)
    })
    bws.on('open', () => {
      bws.subscribeTicker('BTCUSD')
    })
  })

  it('should receive a subscribed success messages', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"subscribed","channel":"trades","chanId":4,"pair":"BTCUSD"}')
      })
    })

    bws.on('subscribed', (data) => {
      assert.equal(data.channel, 'trades')
      assert.equal(data.pair, 'BTCUSD')
      bws.close()
      wss.close(done)
    })
    bws.on('open', () => {
      bws.subscribeTrades('BTCUSD')
    })
  })

  it('#orderBook data should have the defined fields', function (done) {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"subscribed","channel":"book","chanId":13242,"prec":"R0","freq":"F0","len":"25","pair":"BTCUSD"}')
        ws.send(JSON.stringify(orderbookR0))
      })
    })

    bws.once('orderbook', (pair, data) => {
      assert.equal(pair, 'BTCUSD')
      assert.equal(typeof data[0].price, 'number')
      assert.equal(typeof data[0].count, 'number')
      assert.equal(typeof data[0].amount, 'number')
      assert.equal(data.length, 50)
      bws.close()
      wss.close(done)
    })
    bws.on('open', () => {
      bws.subscribeOrderBook('BTCUSD')
    })
  })
})
