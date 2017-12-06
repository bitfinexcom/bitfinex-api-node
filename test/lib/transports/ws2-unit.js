'use strict'

const WebSocket = require('ws')
const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')
const spawnWSServer = require('../../../lib/mocks/ws_server')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const createTestWSv2Instance = (params = {}) => {
  return new WSv2(Object.assign({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: `ws://localhost:${spawnWSServer.port}`
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
      const wss = spawnWSServer()
      const ws = createTestWSv2Instance()
      ws.on('open', () => {
        assert.throws(ws.open.bind(ws))
        wss.close()
        done()
      })
      ws.open()
    })

    it('updates open flag', (done) => {
      const wss = spawnWSServer()
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
      const wss = spawnWSServer()
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
      const wss = spawnWSServer()
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
      const wss = spawnWSServer()
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
      const wss = spawnWSServer()
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
    it('closes & emits error if not on api v2', (done) => {
      const wss = spawnWSServer(spawnWSServer.port, 3)
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