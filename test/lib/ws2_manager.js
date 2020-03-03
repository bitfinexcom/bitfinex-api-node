/* eslint-env mocha */
'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const _isObject = require('lodash/isObject')
const _isArray = require('lodash/isArray')
const WS2Manager = require('../../lib/ws2_manager')
const WSv2 = require('../../lib/transports/ws2')

describe('WS2Manager', () => {
  let m

  afterEach(async () => {
    if (m) {
      try {
        await m.close()
      } catch (e) {
        assert.ok(true, 'may fail due to being modified internally')
      } finally {
        m = null // eslint-disable-line
      }
    }
  })

  describe('setAuthArgs', () => {
    it('updates the internal auth args', () => {
      m = new WS2Manager()
      m.setAuthArgs({ apiKey: '42' })
      assert.strictEqual(m.getAuthArgs().apiKey, '42')
    })
  })

  describe('getAuthArgs', () => {
    it('returns internal auth args', () => {
      m = new WS2Manager()
      m.setAuthArgs({ apiKey: '42' })
      assert.strictEqual(m.getAuthArgs().apiKey, '42')
    })
  })

  describe('reconnect', () => {
    it('calls reconnect on all sockets', async () => {
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: { reconnect: async () => { called = true } }
      })

      await m.reconnect()
      assert.ok(called, 'reconnect not called on socket')
    })

    it('resolves when all sockets reconnect', async () => {
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: {
          reconnect: async () => {
            await Promise.delay(10)
            called = true
          }
        }
      })

      await m.reconnect()
      assert.ok(called, 'reconnect not called on socket')
    })
  })

  describe('close', () => {
    it('calls close on all sockets', async () => {
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: { close: async () => { called = true } }
      })

      await m.close()
      assert.ok(called, 'close not called on socket')
    })

    it('resolves when all sockets close', async () => {
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: {
          close: async () => {
            await Promise.delay(10)
            called = true
          }
        }
      })

      await m.close()
      assert.ok(called, 'close not called on socket')
    })
  })

  describe('getNumSockets', () => {
    it('returns the number of sockets', () => {
      m = new WS2Manager()
      m._sockets.push({})
      m._sockets.push({})
      assert.strictEqual(m.getNumSockets(), 2, 'did not report correct number of sockets')
    })
  })

  describe('getSocket', () => {
    it('returns the socket at the requested index', () => {
      m = new WS2Manager()
      m._sockets.push(1)
      m._sockets.push(42)
      assert.strictEqual(m.getSocket(1), 42)
    })
  })

  describe('getSocketInfo', () => {
    it('returns an array of objects reporting number of data channels per socket', () => {
      m = new WS2Manager()

      m._sockets.push({
        pendingSubscriptions: [[], [], []],
        pendingUnsubscriptions: [[]],
        ws: { getDataChannelCount: () => 2 }
      })

      m._sockets.push({
        pendingSubscriptions: [[], [], []],
        pendingUnsubscriptions: [[]],
        ws: { getDataChannelCount: () => 3 }
      })

      const info = m.getSocketInfo()

      assert.ok(_isArray(info), 'did not return array')
      info.forEach(i => assert.ok(_isObject(i), 'socket info not an object'))
      assert.strictEqual(info[0].nChannels, 4, 'socket info does not report correct number of channels')
      assert.strictEqual(info[1].nChannels, 5, 'socket info does not report correct number of channels')
    })
  })

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
      m = new WS2Manager({ apiKey: 'x', apiSecret: 'x' })

      m.auth({ apiKey: '42', apiSecret: '43' })
      assert.strictEqual(m._socketArgs.apiKey, 'x')
      assert.strictEqual(m._socketArgs.apiSecret, 'x')
    })

    it('saves auth args', () => {
      m = new WS2Manager()

      m.auth({ calc: 1, dms: 4 })
      assert.strictEqual(m._authArgs.calc, 1)
      assert.strictEqual(m._authArgs.dms, 4)
    })

    it('calls auth on existing unauthenticated sockets', (done) => {
      let cred = false
      m = new WS2Manager()

      m._sockets = [{
        ws: {
          isAuthenticated: () => false,
          setAPICredentials: (key, secret) => { cred = `${key}:${secret}` },
          updateAuthArgs: () => {},
          auth: () => {
            assert.strictEqual(cred, '41:42')
            done()
          }
        }
      }]

      m.auth({ apiKey: '41', apiSecret: '42' })
    })
  })

  describe('openSocket', () => {
    it('binds listeners to forward events', async () => {
      const heardEvents = {}
      const events = [
        'open', 'message', 'auth', 'error', 'close', 'subscribed',
        'unsubscribed'
      ]

      m = new WS2Manager()
      const s = m.openSocket()
      const { ws } = s

      events.forEach(e => {
        m.on(e, () => { heardEvents[e] = true })
      })

      events.forEach(e => ws.emit(e))
      events.forEach(e => {
        assert(heardEvents[e])
      })

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    }).timeout(4000)

    it('saves socket state', async () => {
      m = new WS2Manager()
      const s = m.openSocket()
      const { ws } = s

      assert.deepStrictEqual(m._sockets[0], s)

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    }).timeout(4000)

    it('binds \'unsubscribed\' listener to remove channel from pending unsubs', async () => {
      m = new WS2Manager()
      const s = m.openSocket()
      const { ws } = s

      s.pendingUnsubscriptions.push(`${42}`)
      s.ws.emit('unsubscribed', { chanId: 42 })

      assert.strictEqual(s.pendingUnsubscriptions.length, 0)

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    }).timeout(4000)

    it('binds \'subscribed\' listener to remove channel from pending subs', async () => {
      m = new WS2Manager()
      const s = m.openSocket()
      const { ws } = s

      s.pendingSubscriptions.push(['book', { symbol: 'tBTCUSD', prec: 'R0' }])
      s.ws.emit('subscribed', {
        channel: 'book',
        symbol: 'tBTCUSD',
        prec: 'R0',
        len: '25'
      })

      assert.strictEqual(s.pendingSubscriptions.length, 0)

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    }).timeout(4000)

    it('auto-auths if manager has credentials configured', (done) => {
      m = new WS2Manager({
        apiKey: 'key',
        apiSecret: 'secret'
      })

      const s = m.openSocket()
      const { ws } = s

      ws.auth = async () => {
        assert.strictEqual(ws._apiKey, 'key', 'api key not set')
        assert.strictEqual(ws._apiSecret, 'secret', 'api secret not set')

        await ws.close()
        done()
      }
    }).timeout(4000)
  })

  describe('getAuthenticatedSocket', () => {
    it('returns the first authenticated socket found', () => {
      m = new WS2Manager()

      for (let i = 0; i < 3; i += 1) {
        m._sockets.push({
          test: i,
          ws: { isAuthenticated: () => i === 1 }
        })
      }

      assert.strictEqual(m.getAuthenticatedSocket().test, 1, 'did not return correct socket')
    })
  })

  describe('getFreeDataSocket', () => {
    it('returns the first socket below the data channel limit', () => {
      m = new WS2Manager()

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
      m = new WS2Manager()
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
      m = new WS2Manager()
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

  describe('getSocketWithSubRef', () => {
    it('returns the first socket found that has the requested subscription ref', () => {
      m = new WS2Manager()

      for (let i = 0; i < 3; i += 1) {
        m._sockets.push({
          test: i,
          ws: {
            hasSubscriptionRef: (channel, identifier) => {
              assert.strictEqual(channel, 'a', 'did not pass channel through')
              assert.strictEqual(identifier, 'b', 'did not pass identifier through')
              return i === 1
            }
          }
        })
      }

      const s = m.getSocketWithSubRef('a', 'b')
      assert.ok(_isObject(s), 'did not return a socket')
      assert.strictEqual(s.test, 1, 'did not return correct socket')
    })
  })

  describe('subscribe', () => {
    it('delays sub for unopened sockets', () => {
      m = new WS2Manager()
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
      m = new WS2Manager()
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
      m = new WS2Manager()
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
      m = new WS2Manager()
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
      m = new WS2Manager()
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

  describe('managedUnsubscribe', () => {
    it('saves pending unsub and calls managed unsub on socket', () => {
      m = new WS2Manager()
      let unsubCalled = false

      m._sockets[0] = {
        pendingUnsubscriptions: [],
        ws: {
          managedUnsubscribe: (cid) => {
            assert.strictEqual(cid, 42)
            unsubCalled = true
          },

          hasSubscriptionRef: (cid) => cid === 42,
          _chanIdByIdentifier: () => 42
        }
      }

      m.managedUnsubscribe(42)
      assert.deepStrictEqual(m._sockets[0].pendingUnsubscriptions, [42])
      assert(unsubCalled)
    })
  })

  describe('withAllSockets', () => {
    it('calls the provided cb with all internal sockets', () => {
      m = new WS2Manager()
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

  describe('subscribeOrderBook', () => {
    it('calls subscribe with a valid filter and the provided symbol', (done) => {
      m = new WS2Manager()
      m.subscribe = (type, symbol, filter) => {
        assert.ok(_isObject(filter), 'filter not an object')
        assert.strictEqual(filter.symbol, 'tBTCUSD', 'symbol did not match')
        assert.strictEqual(filter.prec, 'P0', 'prec did not match')
        assert.strictEqual(filter.len, '25', 'len did not match')
        assert.strictEqual(filter.freq, 'F0', 'freq did not match')
        assert.strictEqual(symbol, 'tBTCUSD')
        done()
      }

      m.subscribeOrderBook('tBTCUSD', 'P0', '25', 'F0')
    })
  })

  describe('onOrderBook', () => {
    it('passes a valid OB filter to the first socket with a book channel', (done) => {
      const assertFilter = (filter) => {
        assert.ok(_isObject(filter), 'filter not an object')
        assert.strictEqual(filter.symbol, 'tBTCUSD', 'symbol did not match')
        assert.strictEqual(filter.prec, 'P0', 'prec did not match')
        assert.strictEqual(filter.len, '25', 'len did not match')
        assert.strictEqual(filter.freq, 'F0', 'freq did not match')
      }

      m = new WS2Manager()
      m._sockets.push({
        pendingSubscriptions: [],
        pendingUnsubscriptions: [],
        ws: {
          getDataChannelId: (type, filter) => {
            assert.strictEqual(type, 'book')
            assertFilter(filter)
            return 42
          },

          onOrderBook: (filter) => {
            assertFilter(filter)
            done()
          }
        }
      })

      m.onOrderBook({
        symbol: 'tBTCUSD',
        prec: 'P0',
        len: '25',
        freq: 'F0'
      })
    })
  })
})
