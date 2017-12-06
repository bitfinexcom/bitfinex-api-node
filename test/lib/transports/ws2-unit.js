'use strict'

const WebSocket = require('ws')
const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')
const MockWSServer = require('../../../lib/mocks/ws_server')

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
      ws._registerListener('trade', 2, 'tBTCUSD', Map, 42, () => {})

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
      const packet = [42, 'hb']
      ws._channelMap = {
        42: { channel: 'meaning' }
      }
      ws.on('meaning', (msg) => {
        assert.deepEqual(msg, packet)
        done()
      })

      assert(ws._handleChannelMessage(packet))
    })

    it('doesn\'t handle messages from unknown channels', () => {
      const ws = new WSv2()
      const packet = [42, 'hb']
      assert(!ws._handleChannelMessage(packet))
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

          if(++calls === 7) done()
        })

        ws.onTradeEntry({}, () => {
          if(++calls === 7) done()
        })

        ws.onTradeEntry({}, () => {
          if(++calls === 7) done()
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
})

describe('WSv2 event msg handling', () => {
  describe('_handleAuthMessage', () => {
    it('emits an error on auth fail', (done) => {
      const ws = new WSv2()
      ws.on('error', () => {
        done()
      })
      ws._handleAuthMessage({ status: 'FAIL' })
    })

    it('updates auth flag on auth success', () => {
      const ws = new WSv2()
      assert(!ws.isAuthenticated())
      ws._handleAuthMessage({ status: 'OK' })
      assert(ws.isAuthenticated())
    })

    it('adds auth channel to channel map', () => {
      const ws = new WSv2()
      assert(Object.keys(ws._channelMap).length === 0)
      ws._handleAuthMessage({ chanId: 42, status: 'OK' })
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
      ws._handleAuthMessage({ chanId: 0, status: 'OK' })
    })
  })

  describe('_handleSubscribeMessage', () => {
    it('adds channel to channel map', () => {
      const ws = new WSv2()
      assert(Object.keys(ws._channelMap).length === 0)
      ws._handleSubscribedMessage({ chanId: 42, channel: 'test', extra: 'stuff' })
      assert(ws._channelMap[42])
      assert.equal(ws._channelMap[42].chanId, 42)
      assert.equal(ws._channelMap[42].channel, 'test')
      assert.equal(ws._channelMap[42].extra, 'stuff')
    })
  })

  describe('_handleUnsubscribedMessage', () => {
    it('removes channel from channel map', () => {
      const ws = new WSv2()
      assert(Object.keys(ws._channelMap).length === 0)
      ws._handleSubscribedMessage({ chanId: 42, channel: 'test', extra: 'stuff' })
      ws._handleUnsubscribedMessage({ chanId: 42, channel: 'test', extra: 'stuff' })
      assert(Object.keys(ws._channelMap).length === 0)
    })
  })

  describe('_handleInfoMessage', () => {
    it('closes & emits error if not on api v2', (done) => {
      const wss = new MockWSServer(1337, 3)
      const ws = new WSv2()
      let seen = 0

      ws.on('error', () => {
        if (++seen == 2) done()
      })

      ws.on('close', () => {
        if (++seen == 2) done()
      })

      ws.open()
    })
  })
})

describe('WSv2 subscription ref counting', () => {
  // ...
})