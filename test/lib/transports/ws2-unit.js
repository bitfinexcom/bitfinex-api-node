/* eslint-env mocha */
'use strict'

const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')
const { MockWSv2Server } = require('bfx-api-mock-srv')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const createTestWSv2Instance = (params = {}) => {
  return new WSv2(Object.assign({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: 'ws://localhost:9997'
  }, params))
}

describe('WSv2 utilities', () => {
  it('_registerListener: correctly adds listener to internal map with cbGID', () => {
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

  it('enableSequencing: sends the correct conf flag', (done) => {
    const ws = new WSv2()
    ws.send = (packet) => {
      assert.equal(packet.event, 'conf')
      assert.equal(packet.flags, 65536)
      done()
    }
    ws.enableSequencing()
  })

  it('getCandles: returns empty array if no candle set is available', () => {
    const ws = new WSv2()
    assert.deepEqual(ws.getCandles('i.dont.exist'), [])
  })

  it('_sendCalc: stringifes payload & passes it to the ws client', (done) => {
    const ws = new WSv2()

    ws._ws = {}
    ws._ws.send = (data) => {
      assert.equal(data, '[]')
      done()
    }

    ws._sendCalc([])
  })
})

describe('WSv2 lifetime', () => {
  it('starts unopened & unauthenticated', () => {
    const ws = createTestWSv2Instance()

    assert.equal(ws.isOpen(), false)
    assert.equal(ws.isAuthenticated(), false)
  })

  it('open: fails to open twice', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.on('open', () => {
      ws.open().then(() => assert(false)).catch(() => {
        wss.close()
        done()
      })
    })
    ws.open()
  })

  it('open: updates open flag', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.on('open', () => {
      assert.equal(ws.isOpen(), true)
      wss.close()
      done()
    })
    ws.open()
  })

  it('close: doesn\'t close if not open', (done) => {
    const ws = createTestWSv2Instance()
    ws.close().then(() => assert(false)).catch(() => {
      done()
    })
  })

  it('close: fails to close twice', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.open()
    ws.on('open', ws.close.bind(ws))
    ws.on('close', () => {
      ws.close().then(() => assert(false)).catch(() => {
        wss.close()
        done()
      })
    })
  })

  it('close: clears connection state', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws._onWSClose = () => {} // disable fallback reset

    ws.open()
    ws.on('open', () => {
      assert(ws._ws !== null)
      assert(ws._isOpen)

      ws.close().then(() => {
        assert(ws._ws == null)
        assert(!ws._isOpen)

        wss.close()
        done()
      })
    })
  })

  it('auth: fails to auth twice', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.open()
    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      ws.auth().then(() => assert(false)).catch(() => {
        wss.close()
        done()
      })
    })
  })

  it('auth: updates auth flag', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.open()
    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      assert(ws.isAuthenticated())
      wss.close()
      done()
    })
  })

  it('auth: forwards calc param', (done) => {
    const wss = new MockWSv2Server()
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

  it('reconnect: connects if not already connected', (done) => {
    const wss = new MockWSv2Server()
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

  it('reconnect: disconnects & connects back if currently connected', (done) => {
    const wss = new MockWSv2Server()
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

  it('reconnect: automatically auths on open if previously authenticated', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()

    let closed = false
    let opened = false

    ws.on('error', done)

    ws.once('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      setTimeout(() => {
        ws.once('close', () => { closed = true })
        ws.once('open', () => { opened = true })
        ws.once('auth', () => {
          assert(closed)
          assert(opened)
          wss.close()
          done()
        })

        ws.reconnect()
      }, 50)
    })

    ws.open()
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
    const wss = new MockWSv2Server()
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
    const wss = new MockWSv2Server()
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
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance({
      autoReconnect: true
    })

    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
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
    const wss = new MockWSv2Server()
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
    const wss = new MockWSv2Server()
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
      ws._onWSMessage(JSON.stringify([42, [], 9])) //
      ws._onWSMessage(JSON.stringify([42, [], 13])) // error
      ws._onWSMessage(JSON.stringify([42, [], 14]))
      ws._onWSMessage(JSON.stringify([42, [], 15]))

      assert.equal(errorsSeen, 6)
      wss.close()
      done()
    })

    ws.open()
  })
})

describe('WSv2 ws event handlers', () => {
  it('_onWSOpen: updates open flag', () => {
    const ws = new WSv2()
    assert(!ws.isOpen())
    ws._onWSOpen()
    assert(ws.isOpen())
  })

  it('_onWSClose: updates open flag', () => {
    const ws = new WSv2()
    ws._onWSOpen()
    assert(ws.isOpen())
    ws._onWSClose()
    assert(!ws.isOpen())
  })

  it('_onWSError: emits error', (done) => {
    const ws = new WSv2()
    ws.on('error', () => done())
    ws._onWSError(new Error())
  })

  it('_onWSMessage: emits error on invalid packet', (done) => {
    const ws = new WSv2()
    ws.on('error', () => done())
    ws._onWSMessage('I can\'t believe it\'s not JSON!')
  })

  it('_onWSMessage: emits message', (done) => {
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

  it('_onWSNotification: triggers event callbacks for new orders', (done) => {
    const ws = new WSv2()
    const kNew = 'order-new-42'

    ws._eventCallbacks.push(kNew, (err, order) => {
      assert(!err)
      assert(order)
      assert.deepEqual(order, [0, 0, 42])

      ws._eventCallbacks.push(kNew, (err, order) => {
        assert(err)
        assert.deepEqual(order, [0, 0, 42])
        done()
      })

      ws._onWSNotification([0, 'on-req', null, null, [0, 0, 42], 0, 'ERROR'])
    })

    ws._onWSNotification([0, 'on-req', null, null, [0, 0, 42], 0, 'SUCCESS'])
  })

  it('_onWSNotification: triggers event callbacks for cancelled orders', (done) => {
    const ws = new WSv2()
    const kCancel = 'order-cancel-42'

    ws._eventCallbacks.push(kCancel, (err, order) => {
      assert(!err)
      assert(order)
      assert.deepEqual(order, [42])

      ws._eventCallbacks.push(kCancel, (err, order) => {
        assert(err)
        assert.deepEqual(order, [42])
        done()
      })

      ws._onWSNotification([0, 'oc-req', null, null, [42], 0, 'ERROR'])
    })

    ws._onWSNotification([0, 'oc-req', null, null, [42], 0, 'SUCCESS'])
  })
})

describe('WSv2 channel msg handling', () => {
  it('_handleChannelMessage: emits message', (done) => {
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

  it('_handleChannelMessage: calls all registered listeners (nofilter)', (done) => {
    const ws = new WSv2()
    ws._channelMap = { 0: { channel: 'auth' } }
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
    ws._channelMap = { 0: { channel: 'auth' } }
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

    ws._handleChannelMessage([0, 'te', ['tETHUSD']])
    ws._handleChannelMessage([0, 'te', ['tETHUSD']])
    ws._handleChannelMessage([0, 'te', ['tBTCUSD']])
  }

  it('_handleChannelMessage: filters messages if listeners require it (transform)', (done) => {
    doFilterTest(true, done)
  })

  it('_handleChannelMessage: filters messages if listeners require it (no transform)', (done) => {
    doFilterTest(false, done)
  })

  it('_handleChannelMessage: transforms payloads if enabled', (done) => {
    let calls = 0

    const wsTransform = new WSv2({ transform: true })
    const wsNoTransform = new WSv2({ transform: false })
    wsTransform._channelMap = { 0: { channel: 'auth' } }
    wsNoTransform._channelMap = { 0: { channel: 'auth' } }

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

  it('onMessage: calls the listener with all messages (no filter)', (done) => {
    const ws = new WSv2()
    ws._channelMap = { 0: { channel: 'auth' } }

    let calls = 0

    ws.onMessage({}, (msg) => {
      if (++calls === 2) done()
    })

    ws._handleChannelMessage([0, 'wu', []])
    ws._handleChannelMessage([0, 'tu', []])
  })

  it('_payloadPassesFilter: correctly detects matching payloads', () => {
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

  it('_notifyListenerGroup: notifies all matching listeners in the group', (done) => {
    let calls = 0
    const func = () => {
      assert(calls < 3)
      if (++calls === 2) done()
    }

    const lg = {
      '': [{ cb: func }],
      'test': [{ cb: func }],
      'nope': [{ cb: func }]
    }

    WSv2._notifyListenerGroup(lg, [0, 'test', [0, 'tu']], false)
  })

  it('_notifyListenerGroup: doesn\'t fail on missing data if filtering', (done) => {
    const lg = {
      'test': [{
        filter: { 1: 'on' },
        cb: () => {
          done(new Error('filter should not have matched'))
        }
      }]
    }

    WSv2._notifyListenerGroup(lg, [0, 'test'], false)
    done()
  })

  it('_propagateMessageToListeners: notifies all matching listeners', (done) => {
    const ws = new WSv2()
    ws._channelMap = { 0: { channel: 'auth' } }

    ws.onTradeEntry({ pair: 'tBTCUSD' }, () => {
      done()
    })

    ws._propagateMessageToListeners([0, 'te', ['tBTCUSD']])
  })

  it('_notifyCatchAllListeners: passes data to all listeners on the empty \'\' event', () => {
    let s = 0

    const lg = {
      '': [
        { cb: d => { s += d } },
        { cb: d => { s += (d * 2) } }
      ]
    }

    WSv2._notifyCatchAllListeners(lg, 5)
    assert.equal(s, 15)
  })

  it('_handleOBMessage: maintains internal OB if management is enabled', () => {
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

    let ob = ws.getOB('tBTCUSD')
    assert(ob !== null)

    assert.equal(ob.bids.length, 1)
    assert.deepEqual(ob.bids, [[300, 1, 3]])
    assert.equal(ob.asks.length, 2)
    assert.deepEqual(ob.getEntry(100), { price: 100, count: 2, amount: -4 })
    assert.deepEqual(ob.getEntry(200), { price: 200, count: 4, amount: -8 })

    ws._handleOBMessage([42, [300, 0, 1]], ws._channelMap[42])
    ob = ws.getOB('tBTCUSD')
    assert.equal(ob.bids.length, 0)
  })

  it('_handleOBMessage: emits error on internal OB update failure', (done) => {
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

    wsNoTransform.on('error', () => {
      if (++errorsSeen === 2) done()
    })

    wsTransform.on('error', () => {
      if (++errorsSeen === 2) done()
    })

    wsTransform._handleOBMessage([42, [100, 0, 1]], wsTransform._channelMap[42])
    wsNoTransform._handleOBMessage([42, [100, 0, 1]], wsNoTransform._channelMap[42])
  })

  it('_handleOBMessage: forwards managed ob to listeners', (done) => {
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

  it('_handleOBMessage: filters by prec and len', (done) => {
    const ws = new WSv2({ manageOrderBooks: true })
    ws._channelMap = {
      40: {
        channel: 'orderbook',
        symbol: 'tBTCUSD',
        prec: 'P0'
      },

      41: {
        channel: 'orderbook',
        symbol: 'tBTCUSD',
        prec: 'P1'
      },

      42: {
        channel: 'orderbook',
        symbol: 'tBTCUSD',
        prec: 'P2'
      }
    }

    let seen = 0
    ws.onOrderBook({ symbol: 'tBTCUSD', prec: 'P0' }, (ob) => {
      assert(false)
    })

    ws.onOrderBook({ symbol: 'tBTCUSD', prec: 'P1' }, (ob) => {
      assert(false)
    })

    ws.onOrderBook({ symbol: 'tBTCUSD', prec: 'P2' }, (ob) => {
      if (++seen === 2) done()
    })

    ws._handleOBMessage([42, [[100, 2, 3]]], ws._channelMap[42])
    ws._handleOBMessage([42, [100, 2, 3]], ws._channelMap[42])
  })

  it('_handleOBMessage: emits managed ob', (done) => {
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

  it('_handleOBMessage: forwards transformed data if transform enabled', (done) => {
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
      assert.deepEqual(ob.bids, [[100, 2, 3]])
      done()
    })

    ws._handleOBMessage([42, [[100, 2, 3]]], ws._channelMap[42])
  })

  it('_updateManagedOB: returns an error on rm non-existent entry', () => {
    const ws = new WSv2()
    ws._orderBooks.tBTCUSD = [
      [100, 1, 1],
      [200, 2, 1]
    ]

    const err = ws._updateManagedOB('tBTCUSD', [150, 0, -1])
    assert(err)
    assert(err instanceof Error)
  })

  it('_updateManagedOB: correctly maintains transformed OBs', () => {
    const ws = new WSv2({ transform: true })
    ws._orderBooks.tBTCUSD = []

    assert(!ws._updateManagedOB('tBTCUSD', [100, 1, 1]))
    assert(!ws._updateManagedOB('tBTCUSD', [200, 1, -1]))
    assert(!ws._updateManagedOB('tBTCUSD', [200, 0, -1]))

    const ob = ws.getOB('tBTCUSD')

    assert.equal(ob.bids.length, 1)
    assert.equal(ob.asks.length, 0)
    assert.deepEqual(ob.bids, [[100, 1, 1]])
  })

  it('_updateManagedOB: correctly maintains non-transformed OBs', () => {
    const ws = new WSv2()
    ws._orderBooks.tBTCUSD = []

    assert(!ws._updateManagedOB('tBTCUSD', [100, 1, 1]))
    assert(!ws._updateManagedOB('tBTCUSD', [200, 1, -1]))
    assert(!ws._updateManagedOB('tBTCUSD', [200, 0, -1]))

    const ob = ws._orderBooks.tBTCUSD

    assert.equal(ob.length, 1)
    assert.deepEqual(ob, [[100, 1, 1]])
  })

  it('_handleCandleMessage: maintains internal candles if management is enabled', () => {
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

  it('_handleCandleMessage: emits error on internal candle update failure', (done) => {
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
      if (++errorsSeen === 1) done()
    })

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

  it('_handleCandleMessage: forwards managed candles to listeners', (done) => {
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

  it('_handleCandleMessage: emits managed candles', (done) => {
    const ws = new WSv2({ manageCandles: true })
    ws._channelMap = { 42: {
      channel: 'candles',
      key: 'trade:1m:tBTCUSD'
    }}

    ws.on('candle', (data, key) => {
      assert.equal(key, 'trade:1m:tBTCUSD')
      assert.deepEqual(data, [[5, 10, 70, 150, 30, 10]])
      done()
    })

    ws._handleCandleMessage([
      42,
      [[5, 10, 70, 150, 30, 10]]
    ], ws._channelMap[42])
  })

  it('_handleCandleMessage: forwards transformed data if transform enabled', (done) => {
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

  it('_updateManagedCandles: returns an error on update for unknown key', () => {
    const ws = new WSv2()
    ws._candles['trade:1m:tBTCUSD'] = []

    const err = ws._updateManagedCandles('trade:30m:tBTCUSD', [
      1, 10, 70, 150, 30, 10
    ])

    assert(err)
    assert(err instanceof Error)
  })

  it('_updateManagedCandles: correctly maintains transformed OBs', () => {
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

  it('_updateManagedCandles: correctly maintains non-transformed OBs', () => {
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

describe('WSv2 event msg handling', () => {
  it('_handleErrorEvent: emits error', (done) => {
    const ws = new WSv2()
    ws.on('error', (err) => {
      if (err === 42) done()
    })
    ws._handleErrorEvent(42)
  })

  it('_handleConfigEvent: emits error if config failed', (done) => {
    const ws = new WSv2()
    ws.on('error', (err) => {
      if (err.message.indexOf('42') !== -1) done()
    })
    ws._handleConfigEvent({ status: 'bad', flags: 42 })
  })

  it('_handleAuthEvent: emits an error on auth fail', (done) => {
    const ws = new WSv2()
    ws.on('error', () => {
      done()
    })
    ws._handleAuthEvent({ status: 'FAIL' })
  })

  it('_handleAuthEvent: updates auth flag on auth success', () => {
    const ws = new WSv2()
    assert(!ws.isAuthenticated())
    ws._handleAuthEvent({ status: 'OK' })
    assert(ws.isAuthenticated())
  })

  it('_handleAuthEvent: adds auth channel to channel map', () => {
    const ws = new WSv2()
    assert(Object.keys(ws._channelMap).length === 0)
    ws._handleAuthEvent({ chanId: 42, status: 'OK' })
    assert(ws._channelMap[42])
    assert.equal(ws._channelMap[42].channel, 'auth')
  })

  it('_handleAuthEvent: emits auth message', (done) => {
    const ws = new WSv2()
    ws.once('auth', (msg) => {
      assert.equal(msg.chanId, 0)
      assert.equal(msg.status, 'OK')
      done()
    })
    ws._handleAuthEvent({ chanId: 0, status: 'OK' })
  })

  it('_handleSubscribedEvent: adds channel to channel map', () => {
    const ws = new WSv2()
    assert(Object.keys(ws._channelMap).length === 0)
    ws._handleSubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
    assert(ws._channelMap[42])
    assert.equal(ws._channelMap[42].chanId, 42)
    assert.equal(ws._channelMap[42].channel, 'test')
    assert.equal(ws._channelMap[42].extra, 'stuff')
  })

  it('_handleUnsubscribedEvent: removes channel from channel map', () => {
    const ws = new WSv2()
    assert(Object.keys(ws._channelMap).length === 0)
    ws._handleSubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
    ws._handleUnsubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
    assert(Object.keys(ws._channelMap).length === 0)
  })

  it('_handleInfoEvent: passes message to relevant listeners (raw access)', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.once('open', () => {
      let n = 0

      ws._infoListeners[42] = [
        () => { n += 1 },
        () => { n += 2 }
      ]

      ws._handleInfoEvent({ code: 42 })

      assert.equal(n, 3)
      wss.close()
      done()
    })

    ws.open()
  })

  it('_handleInfoEvent: passes message to relevant listeners', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.once('open', () => {
      let n = 0

      ws.onInfoMessage(42, () => { n += 1 })
      ws.onInfoMessage(42, () => { n += 2 })
      ws._handleInfoEvent({ code: 42 })

      assert.equal(n, 3)
      wss.close()
      done()
    })

    ws.open()
  })

  it('_handleInfoEvent: passes message to relevant named listeners', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    ws.once('open', () => {
      let n = 0

      ws.onServerRestart(() => { n += 1 })
      ws.onMaintenanceStart(() => { n += 10 })
      ws.onMaintenanceEnd(() => { n += 100 })

      ws._handleInfoEvent({ code: WSv2.info.SERVER_RESTART })
      ws._handleInfoEvent({ code: WSv2.info.MAINTENANCE_START })
      ws._handleInfoEvent({ code: WSv2.info.MAINTENANCE_END })

      assert.equal(n, 111)
      wss.close()
      done()
    })

    ws.open()
  })

  it('_handleInfoEvent: closes & emits error if not on api v2', (done) => {
    const wss = new MockWSv2Server()
    const ws = createTestWSv2Instance()
    let seen = 0

    const d = () => {
      wss.close()
      done()
    }

    ws.once('open', () => {
      ws.on('error', () => { if (++seen === 2) { d() } })
      ws.on('close', () => { if (++seen === 2) { d() } })

      ws._handleInfoEvent({ version: 3 })
    })

    ws.open()
  })

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

describe('WSv2 packet watch-dog', () => {
  it('resets the WD timeout on every websocket message', (done) => {
    const ws = new WSv2({ packetWDDelay: 1000 })
    assert.equal(ws._packetWDTimeout, null)

    ws.on('error', () => {}) // ignore json errors

    let wdResets = 0
    ws._resetPacketWD = () => {
      if (++wdResets === 4) done()
    }

    ws._onWSMessage('asdf')
    ws._onWSMessage('asdf')
    ws._onWSMessage('asdf')
    ws._onWSMessage('asdf')
  })

  it('_resetPacketWD: clears existing wd timeout', (done) => {
    const ws = new WSv2({ packetWDDelay: 1000 })
    ws._packetWDTimeout = setTimeout(() => {
      assert(false)
    }, 100)

    ws._resetPacketWD()
    setTimeout(done, 200)
  })

  it('_resetPacketWD: schedules new wd timeout', (done) => {
    const ws = new WSv2({ packetWDDelay: 500 })
    ws._isOpen = true
    ws._triggerPacketWD = () => done()
    ws._resetPacketWD()
    assert(ws._packetWDTimeout !== null)
  })

  it('_triggerPacketWD: does nothing if wd is disabled', (done) => {
    const ws = new WSv2()
    ws._isOpen = true
    ws.reconnect = () => assert(false)
    ws._triggerPacketWD()

    setTimeout(() => {
      done()
    }, 50)
  })

  it('_triggerPacketWD: calls reconnect()', (done) => {
    const ws = new WSv2({ packetWDDelay: 1000 })
    ws._isOpen = true
    ws.reconnect = () => done()
    ws._triggerPacketWD()
  })

  it('triggers wd when no packet arrives after delay elapses', (done) => {
    const ws = new WSv2({ packetWDDelay: 100 })
    const now = Date.now()
    ws._isOpen = true

    ws.on('error', () => {}) // invalid json to prevent message routing
    ws._triggerPacketWD = () => {
      assert((Date.now() - now) >= 95)
      done()
    }

    ws._onWSMessage('asdf') // send first packet, init wd
  })

  it('doesn\'t trigger wd when packets arrive as expected', (done) => {
    const ws = new WSv2({ packetWDDelay: 100 })
    ws._isOpen = true

    ws.on('error', () => {}) // invalid json to prevent message routing

    const sendInterval = setInterval(() => {
      ws._onWSMessage('asdf')
    }, 50)

    ws._triggerPacketWD = () => assert(false)
    ws._onWSMessage('asdf')

    setTimeout(() => {
      clearInterval(sendInterval)
      done()
    }, 200)
  })
})
