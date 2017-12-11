/* eslint-env mocha */
'use strict'

const WebSocket = require('ws')
const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')
const MockWSServer = require('../../../lib/mocks/ws_server')
const { OrderBook } = require('../../../lib/models')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const createTestWSv2Instance = (params = {}) => {
  return new WSv2(Object.assign({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: 'ws://localhost:1337'
  }, params))
}

describe('WSv2 utilities', () => {
  describe('_registerListener', () => {
    it('correctly adds listener to internal map with cbGID', () => {
      const ws = new WSv2()
      ws._registerListener('trade', { 2: 'tBTCUSD' }, Map, 42, () => {})

      const { _listeners } = ws

      assert.equal(Object.keys(_listeners).length, 1)
      assert.equal(Object.keys(_listeners)[0], 42)
      assert.equal(typeof _listeners[42], 'object')

      const listenerSet = _listeners[42]

      assert.equal(Object.keys(listenerSet).length, 1)
      assert.equal(Object.keys(listenerSet)[0], 'trade')
      assert.equal(listenerSet.trade.constructor.name, 'Array')
      assert.equal(listenerSet.trade.length, 1)

      const listener = listenerSet.trade[0]

      assert.equal(listener.modelClass, Map)
      assert.deepEqual(listener.filter, { '2': 'tBTCUSD' })
      assert.equal(typeof listener.cb, 'function')
    })
  })

  describe('enableSequencing', () => {
    it('sends the correct conf flag', (done) => {
      const ws = new WSv2()
      ws.send = (packet) => {
        assert.equal(packet.event, 'conf')
        assert.equal(packet.flags, 65536)
        done()
      }
      ws.enableSequencing()
    })
  })
})

describe('WSv2 lifetime', () => {
  it('starts unopened & unauthenticated', () => {
    const ws = createTestWSv2Instance()

    assert.equal(ws.isOpen(), false)
    assert.equal(ws.isAuthenticated(), false)
  })

  describe('open', () => {
    it('fails to open twice', (done) => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()
      ws.on('open', () => {
        assert.throws(ws.open.bind(ws))
        wss.close()
        done()
      })
      ws.open()
    })

    it('updates open flag', (done) => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()
      ws.on('open', () => {
        assert.equal(ws.isOpen(), true)
        wss.close()
        done()
      })
      ws.open()
    })
  })

  describe('close', () => {
    it('doesn\'t close if not open', () => {
      const ws = createTestWSv2Instance()
      assert.throws(ws.close.bind(ws))
    })

    it('fails to close twice', (done) => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()
      ws.open()
      ws.on('open', ws.close.bind(ws))
      ws.on('close', () => {
        assert.throws(ws.close.bind(ws))
        wss.close()
        done()
      })
    })
  })

  describe('auth', () => {
    it('fails to auth twice', (done) => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()
      ws.open()
      ws.on('open', ws.auth.bind(ws))
      ws.once('auth', () => {
        assert.throws(ws.auth.bind(ws))
        wss.close()
        done()
      })
    })

    it('updates auth flag', (done) => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()
      ws.open()
      ws.on('open', ws.auth.bind(ws))
      ws.once('auth', () => {
        assert(ws.isAuthenticated())
        wss.close()
        done()
      })
    })

    it('forwards calc param', () => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()
      ws.open()
      ws.on('open', () => {
        ws.send = (data) => {
          assert.equal(data.calc, 42)
          wss.close()
          done()
        }

        ws.auth(42)
      })
    })
  })

  describe('reconnect', () => {
    it('connects if not already connected', (done) => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()

      ws.on('close', () => {
        assert(false)
      })

      ws.on('open', () => {
        wss.close()
        done()
      })

      ws.reconnect()
    })

    it('disconnects & connects back if currently connected', () => {
      const wss = new MockWSServer()
      const ws = createTestWSv2Instance()

      let calls = 0

      ws.on('close', () => {
        if (++calls === 2) {
          wss.close()
          done()
        }
      })

      ws.once('open', () => {
        ws.reconnect()

        ws.once('open', () => {
          if (++calls === 2) {
            wss.close()
            done()
          }
        })
      })

      ws.open()
    })
  })
})

describe('WSv2 constructor', () => {
  it('defaults to production WS url', () => {
    const ws = new WSv2()
    assert.notEqual(ws._url.indexOf('api.bitfinex.com'), -1)
  })

  it('defaults to no transform', () => {
    const ws = createTestWSv2Instance()
    const transWS = createTestWSv2Instance({ transform: true })
    assert.equal(ws._transform, false)
    assert.equal(transWS._transform, true)
  })
})

describe('WSv2 auto reconnect', () => {
  it('reconnects on close if autoReconnect is enabled', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance({
      autoReconnect: true
    })

    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      ws.reconnect = () => done()
      wss.close() // trigger reconnect
    })

    ws.open()
  })

  it('respects reconnectDelay', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance({
      autoReconnect: true,
      reconnectDelay: 75
    })

    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      let now = Date.now()

      ws.reconnect = () => {
        assert((Date.now() - now) >= 70)
        done()
      }

      wss.close() // trigger reconnect
    })

    ws.open()
  })

  it('does not auto-reconnect if explicity closed', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance({
      autoReconnect: true
    })

    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      let now = Date.now()

      ws.reconnect = () => assert(false)
      ws.close()

      setTimeout(() => {
        wss.close()
        done()
      }, 50)
    })

    ws.open()
  })
})

describe('WSv2 seq audit', () => {
  it('automatically enables sequencing if seqAudit is true in constructor', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance({
      seqAudit: true
    })

    wss._onClientMessage = (ws, msgJSON) => {
      const msg = JSON.parse(msgJSON)

      if (msg.event === 'conf' && msg.flags === 65536) {
        wss.close()
        done()
      }
    }

    ws.open()
  })

  it('emits error on invalid seq number', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance({
      seqAudit: true
    })

    let errorsSeen = 0

    ws.once('open', ws.auth.bind(ws))
    ws.on('error', (err) => {
      if (err.message.indexOf('seq #') !== -1) errorsSeen++

      return null
    })

    ws.once('auth', () => {
      ws._channelMap[42] = { channel: 'trades', chanId: 42 }

      ws._onWSMessage(JSON.stringify([0, 'tu', [], 0, 0]))
      ws._onWSMessage(JSON.stringify([0, 'te', [], 1, 0]))
      ws._onWSMessage(JSON.stringify([0, 'wu', [], 2, 1]))
      ws._onWSMessage(JSON.stringify([0, 'tu', [], 3, 2])) //
      ws._onWSMessage(JSON.stringify([0, 'tu', [], 4, 4])) // error
      ws._onWSMessage(JSON.stringify([0, 'tu', [], 5, 5]))
      ws._onWSMessage(JSON.stringify([0, 'tu', [], 6, 6]))
      ws._onWSMessage(JSON.stringify([42, [], 7]))
      ws._onWSMessage(JSON.stringify([42, [], 8]))
      ws._onWSMessage(JSON.stringify([42, [], 9]))  //
      ws._onWSMessage(JSON.stringify([42, [], 13])) // error
      ws._onWSMessage(JSON.stringify([42, [], 14]))
      ws._onWSMessage(JSON.stringify([42, [], 15]))

      assert.equal(errorsSeen, 2)
      done()
    })

    ws.open()
  })
})

describe('WSv2 ws event handlers', () => {
  describe('_onWSOpen', () => {
    it('updates open flag', () => {
      const ws = new WSv2()
      assert(!ws.isOpen())
      ws._onWSOpen()
      assert(ws.isOpen())
    })
  })

  describe('_onWSClose', () => {
    it('updates open flag', () => {
      const ws = new WSv2()
      ws._onWSOpen()
      assert(ws.isOpen())
      ws._onWSClose()
      assert(!ws.isOpen())
    })
  })

  describe('_onWSError', () => {
    it('emits error', (done) => {
      const ws = new WSv2()
      ws.on('error', () => done())
      ws._onWSError(new Error())
    })
  })

  describe('_onWSMessage', () => {
    it('emits error on invalid packet', (done) => {
      const ws = new WSv2()
      ws.on('error', () => done())
      ws._onWSMessage('I can\'t believe it\'s not JSON!')
    })

    it('emits message', (done) => {
      const ws = new WSv2()
      const msg = [1]
      const flags = 'flags'

      ws.on('message', (m, f) => {
        assert.deepEqual(m, msg)
        assert.equal(flags, 'flags')
        done()
      })

      ws._onWSMessage(JSON.stringify(msg), flags)
    })
  })
})

describe('WSv2 channel msg handling', () => {
  describe('_handleChannelMessage', () => {
    it('emits message', (done) => {
      const ws = new WSv2()
      const packet = [42, 'tu', []]
      ws._channelMap = {
        42: { channel: 'meaning' }
      }
      ws.on('meaning', (msg) => {
        assert.deepEqual(msg, packet)
        done()
      })

      ws._handleChannelMessage(packet)
    })

    describe('listener handling', () => {
      it('calls all registered listeners (nofilter)', (done) => {
        const ws = new WSv2()
        ws._channelMap = { 0: { channel: 'auth' }}
        let called = 0
        ws.onWalletUpdate({}, () => {
          if (++called === 2) done()
        })

        ws.onWalletUpdate({}, () => {
          if (++called === 2) done()
        })

        ws._handleChannelMessage([0, 'wu', []])
      })

      const doFilterTest = (transform, done) => {
        const ws = new WSv2({ transform })
        ws._channelMap = { 0: { channel: 'auth' }}
        let calls = 0
        let btcListenerCalled = false

        ws.onTradeEntry({ pair: 'tBTCUSD' }, () => {
          assert(!btcListenerCalled)
          btcListenerCalled = true

          if (++calls === 7) done()
        })

        ws.onTradeEntry({}, () => {
          if (++calls === 7) done()
        })

        ws.onTradeEntry({}, () => {
          if (++calls === 7) done()
        })

        ws._handleChannelMessage([0, 'te', [0, 'tETHUSD']])
        ws._handleChannelMessage([0, 'te', [0, 'tETHUSD']])
        ws._handleChannelMessage([0, 'te', [0, 'tBTCUSD']])
      }

      it('filters messages if listeners require it (transform)', (done) => {
        doFilterTest(true, done)
      })

      it('filters messages if listeners require it (no transform)', (done) => {
        doFilterTest(false, done)
      })

      it('transforms payloads if enabled', (done) => {
        let calls = 0

        const wsTransform = new WSv2({ transform: true })
        const wsNoTransform = new WSv2({ transform: false })
        wsTransform._channelMap = { 0: { channel: 'auth' }}
        wsNoTransform._channelMap = { 0: { channel: 'auth' }}

        const tradeData = [
          0, 'tBTCUSD', Date.now(), 0, 0.1, 1, 'type', 1, 1, 0.001, 'USD'
        ]

        wsNoTransform.onTradeUpdate({}, (trade) => {
          assert.equal(trade.constructor.name, 'Array')
          assert.deepEqual(trade, tradeData)

          if (calls++ === 1) done()
        })

        wsTransform.onTradeUpdate({}, (trade) => {
          assert.equal(trade.constructor.name, 'Trade')
          assert.equal(trade.id, tradeData[0])
          assert.equal(trade.pair, tradeData[1])
          assert.equal(trade.mtsCreate, tradeData[2])
          assert.equal(trade.orderID, tradeData[3])
          assert.equal(trade.execAmount, tradeData[4])
          assert.equal(trade.execPrice, tradeData[5])
          assert.equal(trade.orderType, tradeData[6])
          assert.equal(trade.orderPrice, tradeData[7])
          assert.equal(trade.maker, tradeData[8])
          assert.equal(trade.fee, tradeData[9])
          assert.equal(trade.feeCurrency, tradeData[10])

          if (calls++ === 1) done()
        })

        wsTransform._handleChannelMessage([0, 'tu', tradeData])
        wsNoTransform._handleChannelMessage([0, 'tu', tradeData])
      })
    })
  })

  describe('onMessage', () => {
    it('calls the listener with all messages (no filter)', (done) => {
      const ws = new WSv2()
      ws._channelMap = { 0: { channel: 'auth' }}

      let calls = 0

      ws.onMessage({}, (msg) => {
        if (++calls === 2) done()
      })

      ws._handleChannelMessage([0, 'wu', []])
      ws._handleChannelMessage([0, 'tu', []])
    })
  })

  describe('_payloadPassesFilter', () => {
    it('correctly detects matching payloads', () => {
      const filter = {
        1: 'tBTCUSD'
      }

      const goodPayloads = [
        [0, 'tBTCUSD', 42, ''],
        [0, 'tBTCUSD', 3.14, '']
      ]

      const badPayloads = [
        [0, 'tETHUSD', 42, ''],
        [0, 'tETHUSD', 3.14, '']
      ]

      goodPayloads.forEach(p => assert(WSv2._payloadPassesFilter(p, filter)))
      badPayloads.forEach(p => assert(!WSv2._payloadPassesFilter(p, filter)))
    })
  })

  describe('_notifyListenerGroup', () => {
    it('notifies all matching listeners in the group', () => {
      let calls = 0
      const func = () => { if (assert(calls < 3) && ++calls === 2) { done() } }
      const lg = {
        '': [{ cb: func }],
        'test': [{ cb: func }],
        'nope': [{ cb: func }]
      }

      WSv2._notifyListenerGroup(lg, [0, 'test', [0, 'tu']], false)
    })
  })

  describe('_propagateMessageToListeners', () => {
    it('notifies all matching listeners', (done) => {
      const ws = new WSv2()
      ws._channelMap = { 0: { channel: 'auth' }}

      ws.onTradeEntry({ pair: 'tBTCUSD' }, () => {
        done()
      })

      ws._propagateMessageToListeners([0, 'te', [0, 'tBTCUSD']])
    })
  })

  describe('_notifyCatchAllListeners', () => {
    it('passes data to all listeners on the empty \'\' event', () => {
      let s = 0

      const lg = {
        '': [
          { cb: d => s += d },
          { cb: d => s += (d * 2) }
        ]
      }

      WSv2._notifyCatchAllListeners(lg, 5)
      assert.equal(s, 15)
    })
  })

  describe('_handleOBMessage', () => {
    it('maintains internal OB if management is enabled', () => {
      const ws = new WSv2({
        manageOrderBooks: true,
        transform: true
      })

      ws._channelMap = { 42: {
        channel: 'orderbook',
        symbol: 'tBTCUSD'
      }}

      ws._handleOBMessage([42, [
        [100, 2, -4],
        [200, 4, -8],
        [300, 1, 3]
      ]], ws._channelMap[42])

      assert(ws._orderBooks.tBTCUSD)
      const ob = ws._orderBooks.tBTCUSD

      assert.equal(ob.bids.length, 1)
      assert.deepEqual(ob.bids, [[300, 1, 3]])
      assert.equal(ob.asks.length, 2)
      assert.deepEqual(ob.getEntry(100), { price: 100, count: 2, amount: -4 })
      assert.deepEqual(ob.getEntry(200), { price: 200, count: 4, amount: -8 })

      ws._handleOBMessage([42, [300, 0, 1]], ws._channelMap[42])
      assert.equal(ob.bids.length, 0)
    })

    it('emits error on internal OB update failure', (done) => {
      const wsNoTransform = new WSv2({ manageOrderBooks: true })
      const wsTransform = new WSv2({
        manageOrderBooks: true,
        transform: true
      })

      wsNoTransform._channelMap = { 42: {
        channel: 'orderbook',
        symbol: 'tBTCUSD'
      }}

      wsTransform._channelMap = wsNoTransform._channelMap

      let errorsSeen = 0

      wsNoTransform.on('error', (err) => {
        if (++errorsSeen === 2) done()
      })

      wsTransform.on('error', (err) => {
        if (++errorsSeen === 2) done()
      })

      wsTransform._handleOBMessage([42, [100, 0, 1]], wsTransform._channelMap[42])
      wsNoTransform._handleOBMessage([42, [100, 0, 1]], wsNoTransform._channelMap[42])
    })

    it('forwards managed ob to listeners', (done) => {
      const ws = new WSv2({ manageOrderBooks: true })
      ws._channelMap = { 42: {
        channel: 'orderbook',
        symbol: 'tBTCUSD'
      }}

      let seen = 0
      ws.onOrderBook({ symbol: 'tBTCUSD' }, (ob) => {
        assert.deepEqual(ob, [[100, 2, 3]])
        if (++seen === 2) done()
      })

      ws.onOrderBook({}, (ob) => {
        assert.deepEqual(ob, [[100, 2, 3]])
        if (++seen === 2) done()
      })

      ws._handleOBMessage([42, [[100, 2, 3]]], ws._channelMap[42])
    })

    it('emits managed ob', (done) => {
      const ws = new WSv2({ manageOrderBooks: true })
      ws._channelMap = { 42: {
        channel: 'orderbook',
        symbol: 'tBTCUSD'
      }}

      ws.on('orderbook', (symbol, data) => {
        assert.equal(symbol, 'tBTCUSD')
        assert.deepEqual(data, [[100, 2, 3]])
        done()
      })

      ws._handleOBMessage([42, [[100, 2, 3]]], ws._channelMap[42])
    })

    it('forwards transformed data if transform enabled', (done) => {
      const ws = new WSv2({ transform: true })
      ws._channelMap = { 42: {
        chanId: 42,
        channel: 'orderbook',
        symbol: 'tBTCUSD'
      }}

      ws.onOrderBook({ symbol: 'tBTCUSD' }, (ob) => {
        assert(ob.asks)
        assert(ob.bids)
        assert.equal(ob.asks.length, 0)
        assert.deepEqual(ob.bids, [{ price: 100, count: 2, amount: 3 }])
        done()
      })

      ws._handleOBMessage([42, [[100, 2, 3]]], ws._channelMap[42])
    })
  })

  describe('_updateManagedOB', () => {
    it('returns an error on rm non-existent entry', () => {
      const ws = new WSv2()
      ws._orderBooks.tBTCUSD = [
        [100, 1, 1],
        [200, 2, 1]
      ]

      const err = ws._updateManagedOB('tBTCUSD', [150, 0, -1])
      assert(err)
      assert(err instanceof Error)
    })

    it('returns error if update is snap & ob exists', () => {
      const ws = new WSv2()
      const errA = ws._updateManagedOB('tBTCUSD', [[150, 0, -1]])
      const errB = ws._updateManagedOB('tBTCUSD', [[150, 0, -1]])

      assert(!errA)
      assert(errB)
      assert(errB instanceof Error)
    })

    it('correctly maintains transformed OBs', () => {
      const ws = new WSv2({ transform: true })
      ws._orderBooks.tBTCUSD = new OrderBook()

      assert(!ws._updateManagedOB('tBTCUSD', [100, 1, 1]))
      assert(!ws._updateManagedOB('tBTCUSD', [200, 1, -1]))
      assert(!ws._updateManagedOB('tBTCUSD', [200, 0, -1]))

      const ob = ws._orderBooks.tBTCUSD

      assert.equal(ob.bids.length, 1)
      assert.equal(ob.asks.length, 0)
      assert.deepEqual(ob.bids, [[100, 1, 1]])
    })

    it('correctly maintains non-transformed OBs', () => {
      const ws = new WSv2()
      ws._orderBooks.tBTCUSD = []

      assert(!ws._updateManagedOB('tBTCUSD', [100, 1, 1]))
      assert(!ws._updateManagedOB('tBTCUSD', [200, 1, -1]))
      assert(!ws._updateManagedOB('tBTCUSD', [200, 0, -1]))

      const ob = ws._orderBooks.tBTCUSD

      assert.equal(ob.length, 1)
      assert.deepEqual(ob, [[100, 1, 1]])
    })
  })

  describe('_handleCandleMessage', () => {
    it('maintains internal candles if management is enabled', () => {
      const ws = new WSv2({ manageCandles: true })
      ws._channelMap = { 64: {
        channel: 'candles',
        key: 'trade:1m:tBTCUSD'
      }}

      ws._handleCandleMessage([64, [
        [5, 100, 70, 150, 30, 1000],
        [2, 200, 90, 150, 30, 1000],
        [1, 130, 90, 150, 30, 1000],
        [4, 104, 80, 150, 30, 1000]
      ]], ws._channelMap[64])

      const candles = ws._candles['trade:1m:tBTCUSD']

      // maintains sort
      assert.equal(candles.length, 4)
      assert.equal(candles[0][0], 5)
      assert.equal(candles[1][0], 4)
      assert.equal(candles[2][0], 2)
      assert.equal(candles[3][0], 1)

      // updates existing candle
      ws._handleCandleMessage([
        64,
        [5, 200, 20, 220, 20, 2000]
      ], ws._channelMap[64])

      assert.deepEqual(candles[0], [5, 200, 20, 220, 20, 2000])

      // inserts new candle
      ws._handleCandleMessage([
        64,
        [10, 300, 20, 450, 10, 4000]
      ], ws._channelMap[64])

      assert.deepEqual(candles[0], [10, 300, 20, 450, 10, 4000])
    })

    it('emits error on internal candle update failure', (done) => {
      const ws = new WSv2({ manageCandles: true })
      ws._channelMap = {
        42: {
          channel: 'candles',
          key: 'trade:30m:tBTCUSD'
        },

        64: {
          channel: 'candles',
          key: 'trade:1m:tBTCUSD'
        }
      }

      let errorsSeen = 0

      ws.on('error', () => {
        if (++errorsSeen === 2) done()
      })

      ws._handleCandleMessage([64, [
        [5, 100, 70, 150, 30, 1000],
        [2, 200, 90, 150, 30, 1000],
        [1, 130, 90, 150, 30, 1000],
        [4, 104, 80, 150, 30, 1000]
      ]], ws._channelMap[64])

      // duplicate snapshot
      ws._handleCandleMessage([64, [
        [5, 100, 70, 150, 30, 1000],
        [2, 200, 90, 150, 30, 1000],
        [1, 130, 90, 150, 30, 1000],
        [4, 104, 80, 150, 30, 1000]
      ]], ws._channelMap[64])

      // update for unknown key
      ws._handleCandleMessage([
        42,
        [5, 10, 70, 150, 30, 10]
      ], ws._channelMap[42])
    })

    it('forwards managed candles to listeners', (done) => {
      const ws = new WSv2({ manageCandles: true })
      ws._channelMap = { 42: {
        chanId: 42,
        channel: 'candles',
        key: 'trade:1m:tBTCUSD'
      }}

      let seen = 0
      ws.onCandle({ key: 'trade:1m:tBTCUSD' }, (data) => {
        assert.deepEqual(data, [[5, 10, 70, 150, 30, 10]])
        if (++seen === 2) done()
      })

      ws.onCandle({}, (data) => {
        assert.deepEqual(data, [[5, 10, 70, 150, 30, 10]])
        if (++seen === 2) done()
      })

      ws._handleCandleMessage([
        42,
        [[5, 10, 70, 150, 30, 10]]
      ], ws._channelMap[42])
    })

    it('emits managed candles', (done) => {
      const ws = new WSv2({ manageCandles: true })
      ws._channelMap = { 42: {
        channel: 'candles',
        key: 'trade:1m:tBTCUSD'
      }}

      ws.on('candle', (key, data) => {
        assert.equal(key, 'trade:1m:tBTCUSD')
        assert.deepEqual(data, [[5, 10, 70, 150, 30, 10]])
        done()
      })

      ws._handleCandleMessage([
        42,
        [[5, 10, 70, 150, 30, 10]]
      ], ws._channelMap[42])
    })

    it('forwards transformed data if transform enabled', (done) => {
      const ws = new WSv2({ transform: true })
      ws._channelMap = { 42: {
        chanId: 42,
        channel: 'candles',
        key: 'trade:1m:tBTCUSD'
      }}

      ws.onCandle({ key: 'trade:1m:tBTCUSD' }, (candles) => {
        assert.equal(candles.length, 1)
        assert.deepEqual(candles[0], {
          mts: 5,
          open: 10,
          close: 70,
          high: 150,
          low: 30,
          volume: 10
        })

        done()
      })

      ws._handleCandleMessage([
        42,
        [[5, 10, 70, 150, 30, 10]]
      ], ws._channelMap[42])
    })
  })

  describe('_updateManagedCandles', () => {
    it('returns an error on update for unknown key', () => {
      const ws = new WSv2()
      ws._candles['trade:1m:tBTCUSD'] = []

      const err = ws._updateManagedCandles('trade:30m:tBTCUSD', [
        1, 10, 70, 150, 30, 10
      ])

      assert(err)
      assert(err instanceof Error)
    })

    it('returns error if update is snap & candles exist', () => {
      const ws = new WSv2()
      ws._candles['trade:1m:tBTCUSD'] = [
        [1, 10, 70, 150, 30, 10],
        [2, 10, 70, 150, 30, 10]
      ]

      const err = ws._updateManagedCandles('trade:1m:tBTCUSD', [
        [1, 10, 70, 150, 30, 10]
      ])

      assert(err)
      assert(err instanceof Error)
    })

    it('correctly maintains transformed OBs', () => {
      const ws = new WSv2({ transform: true })

      assert(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        [1, 10, 70, 150, 30, 10],
        [2, 10, 70, 150, 30, 10]
      ]))

      assert(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        2, 10, 70, 150, 30, 500
      ]))

      assert(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        3, 100, 70, 150, 30, 10
      ]))

      const candles = ws._candles['trade:1m:tBTCUSD']

      assert.equal(candles.length, 3)
      assert.deepEqual(candles[0], {
        mts: 3, open: 100, close: 70, high: 150, low: 30, volume: 10
      })

      assert.deepEqual(candles[1], {
        mts: 2, open: 10, close: 70, high: 150, low: 30, volume: 500
      })

      assert.deepEqual(candles[2], {
        mts: 1, open: 10, close: 70, high: 150, low: 30, volume: 10
      })
    })

    it('correctly maintains non-transformed OBs', () => {
      const ws = new WSv2()

      assert(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        [1, 10, 70, 150, 30, 10],
        [2, 10, 70, 150, 30, 10]
      ]))

      assert(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        2, 10, 70, 150, 30, 500
      ]))

      assert(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        3, 100, 70, 150, 30, 10
      ]))

      const candles = ws._candles['trade:1m:tBTCUSD']

      assert.equal(candles.length, 3)
      assert.deepEqual(candles[0], [
        3, 100, 70, 150, 30, 10
      ])

      assert.deepEqual(candles[1], [
        2, 10, 70, 150, 30, 500
      ])

      assert.deepEqual(candles[2], [
        1, 10, 70, 150, 30, 10
      ])
    })
  })
})

describe('WSv2 event msg handling', () => {
  describe('_handleAuthEvent', () => {
    it('emits an error on auth fail', (done) => {
      const ws = new WSv2()
      ws.on('error', () => {
        done()
      })
      ws._handleAuthEvent({ status: 'FAIL' })
    })

    it('updates auth flag on auth success', () => {
      const ws = new WSv2()
      assert(!ws.isAuthenticated())
      ws._handleAuthEvent({ status: 'OK' })
      assert(ws.isAuthenticated())
    })

    it('adds auth channel to channel map', () => {
      const ws = new WSv2()
      assert(Object.keys(ws._channelMap).length === 0)
      ws._handleAuthEvent({ chanId: 42, status: 'OK' })
      assert(ws._channelMap[42])
      assert.equal(ws._channelMap[42].channel, 'auth')
    })

    it('emits auth message', (done) => {
      const ws = new WSv2()
      ws.once('auth', (msg) => {
        assert.equal(msg.chanId, 0)
        assert.equal(msg.status, 'OK')
        done()
      })
      ws._handleAuthEvent({ chanId: 0, status: 'OK' })
    })
  })

  describe('_handleSubscribeEvent', () => {
    it('adds channel to channel map', () => {
      const ws = new WSv2()
      assert(Object.keys(ws._channelMap).length === 0)
      ws._handleSubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
      assert(ws._channelMap[42])
      assert.equal(ws._channelMap[42].chanId, 42)
      assert.equal(ws._channelMap[42].channel, 'test')
      assert.equal(ws._channelMap[42].extra, 'stuff')
    })
  })

  describe('_handleUnsubscribedEvent', () => {
    it('removes channel from channel map', () => {
      const ws = new WSv2()
      assert(Object.keys(ws._channelMap).length === 0)
      ws._handleSubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
      ws._handleUnsubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
      assert(Object.keys(ws._channelMap).length === 0)
    })
  })

  describe('_handleInfoEvent', () => {
    it('closes & emits error if not on api v2', (done) => {
      const ws = createTestWSv2Instance()
      let seen = 0

      ws.on('error', () => { if (++seen === 2) { done() } })
      ws.on('close', () => { if (++seen === 2) { done() } })

      ws._handleInfoEvent({ version: 3 })
    })
  })

  describe('order buffering', () => {
    it('_flushOrderOps: returned promise rejects if not authorised', (done) => {
      const ws = new WSv2()
      ws._orderOpBuffer = [
        [0, 'oc', null, []]
      ]

      ws._flushOrderOps().catch(() => done())
    })

    it('_flushOrderOps: merges the buffer into a multi-op packet & sends', (done) => {
      const ws = new WSv2()
      ws._isAuthenticated = true

      ws._orderOpBuffer = [
        [0, 'oc', null, []],
        [0, 'on', null, []],
        [0, 'oc_multi', null, []],
        [0, 'ou', null, []]
      ]
      const smallOrders = ws._orderOpBuffer.map(o => [o[1], o[3]])

      ws.send = (packet) => {
        assert.equal(packet[1], 'ox_multi')
        assert.equal(packet[3].length, 4)
        done()
      }

      ws._flushOrderOps().catch(() => assert(false))
    })

    it('_flushOrderOps: splits up buffers greater than 15 ops in size', (done) => {
      const ws = new WSv2()
      ws._isAuthenticated = true

      let seenCount = 0

      for (let i = 0; i < 45; i++) {
        ws._orderOpBuffer.push([0, 'oc', null, []])
      }

      ws.send = (packet) => {
        assert.equal(packet[1], 'ox_multi')
        assert(packet[3].length <= 15)
        seenCount += packet[3].length

        if (seenCount === 45) done()
      }

      ws._flushOrderOps().catch(() => assert(false))
    })
  })
})
