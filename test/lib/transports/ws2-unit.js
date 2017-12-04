'use strict'

const WebSocket = require('ws')
const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')

const WSS_PORT = 1337
const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const spawnWSServer = () => {
  return new WebSocket.Server({
    perMessageDeflate: false,
    port: WSS_PORT
  })
}

const createTestWSv2Instance = (params = {}) => {
  return new WSv2(Object.assign({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: `ws://localhost:${WSS_PORT}`
  }, params))
}

describe('WSv2 utilities', () => {
  describe('parseListenerRegArgs', () => {
    it('throws an error on invalid argument count', () => {
      assert.throws(() => WSv2.parseListenerRegArgs('', []))
      assert.throws(() => WSv2.parseListenerRegArgs('', ['a', 'b', 'c', 'd']))
    })

    it('parses just a callback', () =>{
      const { cb, filter, cbGID } = WSv2.parseListenerRegArgs(null, [() => {}])

      assert.equal(typeof cb, 'function')
      assert.equal(typeof filter, 'undefined')
      assert.equal(typeof cbGID, 'undefined')
    })

    it('parses a filter and callback', () => {
      const { cb, filter, cbGID } = WSv2.parseListenerRegArgs('symbol', [
        'tBTCUSD', () => {}
      ])

      assert.equal(typeof cb, 'function')
      assert.equal(typeof filter, 'object')
      assert.equal(typeof cbGID, 'undefined')

      assert.equal(Object.keys(filter).length, 1)
      assert.equal(Object.keys(filter)[0], 'symbol')
      assert.equal(Object.values(filter)[0], 'tBTCUSD')
    })

    it('parses a callback ID and callback', () => {
      const { cb, filter, cbGID } = WSv2.parseListenerRegArgs(null, [
        42, () => {}
      ])

      assert.equal(typeof cb, 'function')
      assert.equal(typeof filter, 'undefined')
      assert.equal(cbGID, 42)
    })

    it('parses a filter, callback ID, and callback', () => {
      const { cb, filter, cbGID } = WSv2.parseListenerRegArgs('symbol', [
        'tBTCUSD', 42, () => {}
      ])

      assert.equal(typeof cb, 'function')
      assert.equal(typeof filter, 'object')
      assert.equal(cbGID, 42)

      assert.equal(Object.keys(filter).length, 1)
      assert.equal(Object.keys(filter)[0], 'symbol')
      assert.equal(Object.values(filter)[0], 'tBTCUSD')
    })
  })

  describe('_registerListenerFromCall', () => {
    it('correctly adds listener to internal map with cbGID', () => {
      const ws = new WSv2()
      ws._registerListenerFromCall('trade', 'symbol', Map, [
        'tBTCUSD', 42, () => {}
      ])

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
      assert.deepEqual(listener.filter, { symbol: 'tBTCUSD' })
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
      const ws = createTestWSv2Instance()
      ws.on('open', () => {
        assert.throws(ws.open.bind(ws))
        done()
      })
      ws.open()
    })

    it('updates open flag', (done) => {
      const ws = createTestWSv2Instance()
      ws.on('open', () => {
        assert.equal(ws.isOpen(), true)
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
      const ws = createTestWSv2Instance()
      ws.open()
      ws.on('open', ws.close.bind(ws))
      ws.on('close', () => {
        assert.throws(ws.close.bind(ws))
        done()
      })
    })
  })

  describe('auth', () => {
    it('fails to auth twice')
    it('updates auth flag')
    it('forwards calc param')
  })
})

describe('WSv2 constructor', () => {
  it('defaults to production WS url', () => {
    const ws = new WSv2()
    assert.notEqual(ws._wsURL.indexOf('api.bitfinex.com'), -1)
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
    it('updates open flag')
  })

  describe('_onWSClose', () => {
    it('updates open flag')
  })

  describe('_onWSError', () => {
    it('emits error')
  })

  describe('_onWSMessage', () => {
    it('gracefully returns on receiving invalid packet')
    it('emits error on invalid packet')
    it('emits message')
    it('forwards channel messages to relevant handler')
    it('forwards event messages to relevant handler')
  })
})

describe('WSv2 channel msg handling', () => {
  describe('_handleChannelMessage', () => {
    it('emits message')
    it('doesn\'t handle messages from unknown channels')

    describe('listener handling', () => {
      it('calls all registered listeners (nofilter)')
      it('correctly filters messages if listeners require it')
      it('transforms payloads if enabled')
    })
  })
})

describe('WSv2 event msg handling', () => {
  describe('_handleEventMessage', () => {
    it('throws an error on unidentified message')
  })

  describe('_handleAuthMessage', () => {
    it('emits an error on auth fail')
    it('updates auth flag on auth success')
    it('adds auth channel to channel map')
    it('emits auth message')
  })

  describe('_handleSubscribeMessage', () => {
    it('adds channel to channel map')
  })

  describe('_handleUnsubscribedMessage', () => {
    it('removes channel from channel map')
  })

  describe('_handleInfoMessage', () => {
    it('enforces api v2')
  })
})

describe('WSv2 subscription ref counting', () => {
  // ...
})