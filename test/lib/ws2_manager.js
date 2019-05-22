/* eslint-env mocha */
'use strict'

const assert = require('assert')
const WS2Manager = require('../../lib/ws2_manager')
const WSv2 = require('../../lib/transports/ws2')

describe('WS2Manager', () => {
  describe('getDataChannelCount', () => {
    it('takes pending subs & unsubs into account', () => {
      const s = {
        ws: new WSv2(),
        pendingSubscriptions: [['book', {}]],
        pendingUnsubscriptions: []
      }

      s.ws._channelMap = {
        0: { channel: 'trades' },
        1: { channel: 'candles', key: 'test' },
        2: { channel: 'auth' }
      }

      const count = WS2Manager.getDataChannelCount(s)

      assert.strictEqual(s.ws.getDataChannelCount(), 2)
      assert.strictEqual(count, 3)
    })
  })

  describe('auth', () => {
    it('does nothing if api key/secret are already provided', () => {
      const m = new WS2Manager({ apiKey: 'x', apiSecret: 'x' })

      m.auth({ apiKey: '42', apiSecret: '43' })
      assert.strictEqual(m._socketArgs.apiKey, 'x')
      assert.strictEqual(m._socketArgs.apiSecret, 'x')
    })

    it('saves auth args', () => {
      const m = new WS2Manager()

      m.auth({ calc: 1, dms: 4 })
      assert.strictEqual(m._authArgs.calc, 1)
      assert.strictEqual(m._authArgs.dms, 4)
    })

    it('calls auth on existing unauthenticated sockets', (done) => {
      let cred = false
      const m = new WS2Manager()

      m._sockets = [{
        ws: {
          isAuthenticated: () => false,
          setAuthCredentials: (key, secret) => { cred = `${key}:${secret}` },
          auth: ({ calc, dms }) => {
            assert.strictEqual(calc, 1)
            assert.strictEqual(dms, 4)
            assert.strictEqual(cred, '41:42')
            done()
          }
        }
      }]

      m.auth({ apiKey: '41', apiSecret: '42', calc: 1, dms: 4 })
    })
  })

  describe('openSocket', () => {
    it('binds listeners to forward events', () => {
      const heardEvents = {}
      const events = [
        'open', 'message', 'auth', 'error', 'close', 'subscribed',
        'unsubscribed'
      ]

      const m = new WS2Manager()
      const s = m.openSocket()
      const { ws } = s

      events.forEach(e => {
        m.on(e, () => { heardEvents[e] = true })
      })

      events.forEach(e => ws.emit(e))
      events.forEach(e => {
        assert(heardEvents[e])
      })
    })

    it('saves socket state', () => {
      const m = new WS2Manager()
      const s = m.openSocket()
      assert.deepStrictEqual(m._sockets[0], s)
    })

    it('binds \'unsubscribed\' listener to remove channel from pending unsubs', () => {
      const m = new WS2Manager()
      const s = m.openSocket()

      s.pendingUnsubscriptions.push(42)
      s.ws.emit('unsubscribed', { chanId: 42 })

      assert.strictEqual(s.pendingUnsubscriptions.length, 0)
    })

    it('binds \'subscribed\' listener to remove channel from pending subs', () => {
      const m = new WS2Manager()
      const s = m.openSocket()

      s.pendingSubscriptions.push(['book', { symbol: 'tBTCUSD', prec: 'R0' }])
      s.ws.emit('subscribed', {
        channel: 'book',
        symbol: 'tBTCUSD',
        prec: 'R0',
        len: '25'
      })

      assert.strictEqual(s.pendingSubscriptions.length, 0)
    })
  })

  describe('getFreeDataSocket', () => {
    it('returns the first socket below the data channel limit', () => {
      const m = new WS2Manager()

      m._sockets[0] = {
        ws: { getDataChannelCount: () => 200 },
        pendingSubscriptions: new Array(70),
        pendingUnsubscriptions: new Array(10)
      }

      m._sockets[1] = {
        ws: { getDataChannelCount: () => 5 },
        pendingSubscriptions: [],
        pendingUnsubscriptions: []
      }

      const s = m.getFreeDataSocket()
      assert.deepStrictEqual(s, m._sockets[1])
    })
  })

  describe('getSocketWithDataChannel', () => {
    it('returns socket subscribed to specified channel/filter pair', () => {
      const m = new WS2Manager()
      m._sockets[0] = {
        ws: {},
        pendingSubscriptions: [['candles', { key: 'test' }]],
        pendingUnsubscriptions: []
      }

      let s = m.getSocketWithDataChannel('candles', { key: 'test' })
      assert.deepStrictEqual(s, m._sockets[0])

      /// /
      m._sockets[0] = {
        ws: { getDataChannelId: () => false },
        pendingSubscriptions: [['auth', {}]],
        pendingUnsubscriptions: []
      }

      s = m.getSocketWithDataChannel('candles', { key: 'test' })
      assert(!s)

      /// /
      m._sockets[0] = {
        ws: {
          getDataChannelId: (type, filter) => {
            assert.strictEqual(type, 'candles')
            assert.deepStrictEqual(filter, { key: 'test' })
            return 1
          }
        },
        pendingSubscriptions: [],
        pendingUnsubscriptions: []
      }

      s = m.getSocketWithDataChannel('candles', { key: 'test' })
      assert.deepStrictEqual(s, m._sockets[0])

      /// /
      m._sockets[0] = {
        ws: {
          getDataChannelId: (type, filter) => {
            assert.strictEqual(type, 'candles')
            assert.deepStrictEqual(filter, { key: 'test' })
            return 1
          }
        },
        pendingSubscriptions: [],
        pendingUnsubscriptions: [1]
      }

      s = m.getSocketWithDataChannel('candles', { key: 'test' })
      assert(!s)
    })
  })

  describe('getSocketWithChannel', () => {
    it('returns correct socket', () => {
      const m = new WS2Manager()
      m._sockets[0] = {
        pendingUnsubscriptions: [],
        ws: {
          hasChannel: (id) => {
            return id === 42
          }
        }
      }

      let s = m.getSocketWithChannel(42)
      assert.deepStrictEqual(s, m._sockets[0])

      /// /
      m._sockets[0] = {
        pendingUnsubscriptions: [42],
        ws: {
          hasChannel: (id) => {
            return id === 42
          }
        }
      }

      s = m.getSocketWithChannel(42)
      assert(!s)
    })
  })

  describe('subscribe', () => {
    it('delays sub for unopened sockets', () => {
      const m = new WS2Manager()
      let onceOpenCalled = false

      m._sockets[0] = {
        pendingSubscriptions: [],
        pendingUnsubscriptions: [],
        ws: {
          getDataChannelCount: () => 0,
          managedSubscribe: () => assert(false),
          isOpen: () => false,
          once: (eName) => {
            assert.strictEqual(eName, 'open')
            onceOpenCalled = true
          }
        }
      }

      m.subscribe('candles', 'test', { key: 'test' })
      assert(onceOpenCalled)
    })

    it('saves pending sub', () => {
      const m = new WS2Manager()
      m._sockets[0] = {
        pendingSubscriptions: [],
        pendingUnsubscriptions: [],
        ws: {
          getDataChannelCount: () => 0,
          managedSubscribe: () => {},
          isOpen: () => true
        }
      }

      m.subscribe('candles', 'test', { key: 'test' })
      assert.deepStrictEqual(m._sockets[0].pendingSubscriptions, [
        ['candles', { key: 'test' }]
      ])
    })

    it('opens a new socket if no sockets are available', () => {
      const m = new WS2Manager()
      let openCalled = false

      m.openSocket = () => {
        openCalled = true

        return {
          pendingSubscriptions: [],
          ws: {
            once: () => {},
            isOpen: () => false // to avoid managed sub
          }
        }
      }

      m.subscribe('candles', 'test', { key: 'test' })
      assert(openCalled)
    })

    it('opens a new socket if no sockets are below data limit', () => {
      const m = new WS2Manager()
      let openCalled = false

      m._sockets[0] = {
        pendingSubscriptions: [],
        pendingUnsubscriptions: [],
        ws: {
          getDataChannelCount: () => 255
        }
      }

      m.openSocket = () => {
        openCalled = true

        const state = {
          pendingSubscriptions: [],
          ws: {
            once: () => {},
            isOpen: () => false // to avoid managed sub
          }
        }

        m._sockets.push(state)
        return state
      }

      m.subscribe('candles', 'test', { key: 'test' })

      assert(openCalled)
      assert.strictEqual(m._sockets.length, 2)
    })
  })

  describe('unsubscribe', () => {
    it('saves pending unsub & calls unsub on socket', () => {
      const m = new WS2Manager()
      let unsubCalled = false

      m._sockets[0] = {
        pendingUnsubscriptions: [],
        ws: {
          unsubscribe: (cid) => {
            assert.strictEqual(cid, 42)
            unsubCalled = true
          },

          hasChannel: (cid) => {
            return cid === 42
          }
        }
      }

      m.unsubscribe(42)
      assert.deepStrictEqual(m._sockets[0].pendingUnsubscriptions, [42])
      assert(unsubCalled)
    })
  })

  describe('withAllSockets', () => {
    it('calls the provided cb with all internal sockets', () => {
      const m = new WS2Manager()
      const socketsSeen = {}

      m._sockets = ['a', 'b', 'c']
      m.withAllSockets((sock) => {
        socketsSeen[sock] = true
      })

      assert(socketsSeen.a)
      assert(socketsSeen.b)
      assert(socketsSeen.c)
    })
  })
})
