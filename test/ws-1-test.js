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

  it('#orderBook data should have the defined fields', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    wss.on('connection', function connection (ws) {
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"subscribed","channel":"book","chanId":13242,"prec":"R0","freq":"F0","len":"25","pair":"BTCUSD"}')
        ws.send(JSON.stringify(orderbookR0))
      })
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    bws.once('orderbook', (pair, data) => {
      assert.equal(pair, 'BTCUSD')
      assert.equal(typeof data[0].price, 'number')
      assert.equal(typeof data[0].orderId, 'number')
      assert.equal(typeof data[0].amount, 'number')
      assert.equal(data.length, 50)
      bws.close()
      wss.close(done)
    })
    bws.on('open', () => {
      bws.subscribeOrderBook('BTCUSD')
    })
  })

  it('#ticker data should have the defined fields', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    wss.on('connection', function connection (ws) {
      ws.send('{"event":"info","version":1.1}')
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"subscribed","channel":"ticker","chanId":4,"pair":"BTCUSD"}')
        ws.send('[4,2169.6,1.93,2169.8,0.0349,100.9,0.0488,2169.6,25479.40978657,2196,2000.1]')
      })
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    bws.once('ticker', (pair, data) => {
      assert.equal(pair, 'BTCUSD')
      assert.equal(typeof data.bid, 'number')
      assert.equal(typeof data.bidSize, 'number')
      assert.equal(typeof data.ask, 'number')
      assert.equal(typeof data.askSize, 'number')
      assert.equal(typeof data.dailyChange, 'number')
      assert.equal(typeof data.dailyChangePerc, 'number')
      assert.equal(typeof data.lastPrice, 'number')
      assert.equal(typeof data.volume, 'number')
      assert.equal(typeof data.high, 'number')
      assert.equal(typeof data.low, 'number')
      bws.close()
      wss.close(done)
    })
    bws.on('open', () => {
      bws.subscribeTicker('BTCUSD')
    })
  })

  it('#trade data should have the defined fields', (done) => {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: PORT
    })

    wss.on('connection', function connection (ws) {
      ws.send('{"event":"info","version":1.1}')
      ws.on('message', function incoming (msg) {
        ws.send('{"event":"subscribed","channel":"trades","chanId":33,"pair":"BTCUSD"}')
        ws.send(`
[33,[[32970704,1495442718,2169.1,0.03647196],[32970701,1495442718,2169.1,0.01058338],
[32970697,1495442717,2169,-0.0000791],[32970696,1495442717,2169,-0.01054738],
[32970692,1495442716,2169,-0.01063712],[32970683,1495442715,2169,-0.00191556],
[32970682,1495442715,2169,-0.02003456],[32970681,1495442715,2169,-0.02002811],
[32970680,1495442715,2169,-0.01079782],[32970679,1495442715,2169,-0.02002726],
[32970678,1495442715,2169,-0.01079782],[32970662,1495442714,2169,-3.68585828],
[32970654,1495442712,2169,-0.01413205],[32970646,1495442711,2169,-0.01066102],
[32970643,1495442710,2169,-0.02002146],[32970640,1495442709,2169,-0.01727607],
[32970631,1495442708,2169,-0.00984518],[32970629,1495442708,2169,-1.07188465],
[32970618,1495442706,2169,-0.0995877],[32970613,1495442706,2169,-0.015553],
[32970595,1495442702,2169,-0.00864857],[32970593,1495442702,2169,-0.01999732],
[32970592,1495442702,2169,-0.01067048],[32970591,1495442702,2169.1,0.92541262],
[32970590,1495442702,2169.1,0.9787866],[32970589,1495442702,2169,-0.01067048],
[32970573,1495442702,2169,-0.01067048],[32970572,1495442702,2169,-0.0172659],
[32970569,1495442701,2169,-0.02000913],[32970567,1495442701,2169,-0.01413205]]]
          `)
      })
    })

    const bws = new BFX('dummy', 'dummy', { version: 1, transform: true, autoOpen: false }).ws
    bws.WebSocketURI = `ws://localhost:${PORT}`
    bws.open()

    bws.once('trade', (pair, data) => {
      assert.equal(pair, 'BTCUSD')
      assert.equal(typeof data[0].seq, 'number')
      assert.equal(typeof data[0].timestamp, 'number')
      assert.equal(typeof data[0].price, 'number')
      assert.equal(typeof data[0].amount, 'number')
      bws.close()
      wss.close(done)
    })
    bws.on('open', () => {
      bws.subscribeTrades('BTCUSD')
    })
  })
})
