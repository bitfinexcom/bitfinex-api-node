/* eslint-env mocha */

'use strict'

const PORT = 1337

const assert = require('assert')
const http = require('http')

const WebSocket = require('ws')

const BFX = require('../index')

const stubResponseTickerFunding = require('./fixtures/response-ws2-server-ticker-funding.json')

describe('BFX', () => {
  describe('simple', () => {
    it('should be loaded', () => {
      assert.equal(typeof BFX, 'function')
    })

    it('throws on using the deprecated way to set options', () => {
      assert.throws(
        () => {
          return new BFX('dummy', 'dummy', 2)
        },
        Error
      )
    })
  })

  describe('integration', () => {
    const testResBody = `[1765.3,
      0.56800816,
      1767.6,
      1.3874,
      -62.2,
      -0.034,
      1765.3,
      14063.54589155,
      1834.2,
      1726.3 ]`

    it('supports http', (done) => {
      const bfx = new BFX('dummy', 'dummy', { version: 2, autoOpen: false })

      const bhttp = bfx.rest
      bhttp.url = `http://localhost:${PORT}`

      const server = http.createServer((req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        })
        res.end(testResBody)
      })

      server.listen(PORT, () => {
        bhttp.ticker('tBTCUSD', (err, res) => {
          assert.equal(err, null)
          assert.deepEqual(
            res,
            JSON.parse(testResBody)
          )

          server.close()
          done()
        })
      })
    })

    it('supports transforming', (done) => {
      const bfx = new BFX('dummy', 'dummy', { version: 2, transform: true, autoOpen: false })

      const bhttp = bfx.rest
      bhttp.url = `http://localhost:${PORT}`

      const server = http.createServer((req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        })
        res.end(testResBody)
      })

      server.listen(PORT, () => {
        bhttp.ticker('tBTCUSD', (err, res) => {
          assert.equal(err, null)
          assert.deepEqual(
            res,
            {
              BID: 1765.3,
              BID_SIZE: 0.56800816,
              ASK: 1767.6,
              ASK_SIZE: 1.3874,
              DAILY_CHANGE: -62.2,
              DAILY_CHANGE_PERC: -0.034,
              LAST_PRICE: 1765.3,
              VOLUME: 14063.54589155,
              HIGH: 1834.2,
              LOW: 1726.3
            }
          )

          server.close()
          done()
        })
      })
    })

    it('ws: supports custom transforms', (done) => {
      const t = function (data) { return data.map((el) => { return el + 'f' }) }

      const bws = new BFX('dummy', 'dummy', { version: 2, transform: t, autoOpen: false }).ws

      bws.websocketURI = `ws://localhost:${PORT}`
      bws.open()

      const wss = new WebSocket.Server({
        perMessageDeflate: false,
        port: PORT
      })

      wss.on('connection', function connection (ws) {
        ws.on('message', function incoming (msg) {
          ws.send('{"event":"info","version":2}')
          ws.send('{"event":"subscribed","channel":"ticker","chanId":22,"symbol":"fUSD","currency":"USD"}')
          ws.send(JSON.stringify(stubResponseTickerFunding))
        })
      })

      bws.on('open', () => {
        bws.subscribeTicker('fUSD')
      })

      bws.on('ticker', (pair, ticker) => {
        assert.deepEqual(ticker, [
          '0.00078458f',
          '0.00075f',
          '30f',
          '3045.59478528f',
          '0.0007825f',
          '2f',
          '2335880.06705868f',
          '-0.0000674f',
          '-0.0793f',
          '0.0007825f',
          '19326761.40360705f',
          '0f',
          '0f'
        ])
        bws.close()
        wss.close(done)
      })
    })

    it('ws: it transforms with default transformer', (done) => {
      const bws = new BFX('dummy', 'dummy', { version: 2, transform: true, autoOpen: false }).ws

      bws.websocketURI = `ws://localhost:${PORT}`
      bws.open()

      const wss = new WebSocket.Server({
        perMessageDeflate: false,
        port: PORT
      })

      wss.on('connection', function connection (ws) {
        ws.on('message', function incoming (msg) {
          ws.send('{"event":"info","version":2}')
          ws.send('{"event":"subscribed","channel":"ticker","chanId":22,"symbol":"fUSD","currency":"USD"}')
          ws.send(JSON.stringify(stubResponseTickerFunding))
        })
      })

      bws.on('open', () => {
        bws.subscribeTicker('fUSD')
      })

      bws.on('ticker', (pair, ticker) => {
        assert.deepEqual(ticker, {
          FRR: 0.00078458,
          BID: 0.00075,
          BID_SIZE: 30,
          BID_PERIOD: 3045.59478528,
          ASK: 0.0007825,
          ASK_SIZE: 2,
          ASK_PERIOD: 2335880.06705868,
          DAILY_CHANGE: -0.0000674,
          DAILY_CHANGE_PERC: -0.0793,
          LAST_PRICE: 0.0007825,
          VOLUME: 19326761.40360705,
          HIGH: 0,
          LOW: 0
        })
        bws.close()
        wss.close(done)
      })
    })

    it('ws: can handle responses without transforms', (done) => {
      const bws = new BFX('dummy', 'dummy', { version: 2, autoOpen: false }).ws

      bws.websocketURI = `ws://localhost:${PORT}`
      bws.open()

      const wss = new WebSocket.Server({
        perMessageDeflate: false,
        port: PORT
      })

      wss.on('connection', function connection (ws) {
        ws.on('message', function incoming (msg) {
          ws.send('{"event":"info","version":2}')
          ws.send('{"event":"subscribed","channel":"ticker","chanId":22,"symbol":"fUSD","currency":"USD"}')
          ws.send(JSON.stringify(stubResponseTickerFunding))
        })
      })

      bws.on('open', () => {
        bws.subscribeTicker('fUSD')
      })

      bws.on('ticker', (pair, ticker) => {
        assert.deepEqual(ticker, [
          0.00078458,
          0.00075,
          30,
          3045.59478528,
          0.0007825,
          2,
          2335880.06705868,
          -0.0000674,
          -0.0793,
          0.0007825,
          19326761.40360705,
          0,
          0
        ])
        bws.close()
        wss.close(done)
      })
    })
  })
})
