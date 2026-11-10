'use strict'

const test = require('brittle')
const _isObject = require('lodash/isObject')
const _isArray = require('lodash/isArray')
const { MockWSv2Server } = require('bfx-api-mock-srv')
const WS2Manager = require('../../lib/ws2_manager')
const WSv2 = require('../../lib/transports/ws2')

test('WS2Manager', async (t) => {
  let m

  const teardown = async () => {
    if (m) {
      try {
        await m.close()
      } catch (e) {
        // may fail due to being modified internally
      } finally {
        m = null // eslint-disable-line
      }
    }
  }

  await t.test('setAuthArgs', async (t) => {
    await t.test('updates the internal auth args', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      m.setAuthArgs({ apiKey: '42' })
      t.is(m.getAuthArgs().apiKey, '42')
    })
  })

  await t.test('getAuthArgs', async (t) => {
    await t.test('returns internal auth args', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      m.setAuthArgs({ apiKey: '42' })
      t.is(m.getAuthArgs().apiKey, '42')
    })
  })

  await t.test('reconnect', async (t) => {
    await t.test('calls reconnect on all sockets', async (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: { reconnect: async () => { called = true } }
      })

      await m.reconnect()
      t.ok(called, 'reconnect not called on socket')
    })

    await t.test('resolves when all sockets reconnect', async (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: {
          reconnect: async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            called = true
          }
        }
      })

      await m.reconnect()
      t.ok(called, 'reconnect not called on socket')
    })
  })

  await t.test('close', async (t) => {
    await t.test('calls close on all sockets', async (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: { close: async () => { called = true } }
      })

      await m.close()
      t.ok(called, 'close not called on socket')
    })

    await t.test('resolves when all sockets close', async (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let called = false

      m._sockets.push({
        ws: {
          close: async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            called = true
          }
        }
      })

      await m.close()
      t.ok(called, 'close not called on socket')
    })
  })

  await t.test('getNumSockets', async (t) => {
    await t.test('returns the number of sockets', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      m._sockets.push({})
      m._sockets.push({})
      t.is(m.getNumSockets(), 2, 'did not report correct number of sockets')
    })
  })

  await t.test('getSocket', async (t) => {
    await t.test('returns the socket at the requested index', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      m._sockets.push(1)
      m._sockets.push(42)
      t.is(m.getSocket(1), 42)
    })
  })

  await t.test('getSocketInfo', async (t) => {
    await t.test('returns an array of objects reporting number of data channels per socket', (t) => {
      t.teardown(teardown)
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

      t.ok(_isArray(info), 'did not return array')
      info.forEach(i => t.ok(_isObject(i), 'socket info not an object'))
      t.is(info[0].nChannels, 4, 'socket info does not report correct number of channels')
      t.is(info[1].nChannels, 5, 'socket info does not report correct number of channels')
    })
  })

  await t.test('getDataChannelCount', async (t) => {
    await t.test('takes pending subs & unsubs into account', (t) => {
      t.teardown(teardown)
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

      t.is(s.ws.getDataChannelCount(), 2)
      t.is(count, 3)
    })
  })

  await t.test('auth', async (t) => {
    await t.test('does nothing if api key/secret are already provided', (t) => {
      t.teardown(teardown)
      m = new WS2Manager({ apiKey: 'x', apiSecret: 'x' })

      m.auth({ apiKey: '42', apiSecret: '43' })
      t.is(m._socketArgs.apiKey, 'x')
      t.is(m._socketArgs.apiSecret, 'x')
    })

    await t.test('saves auth args', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()

      m.auth({ calc: 1, dms: 4 })
      t.is(m._authArgs.calc, 1)
      t.is(m._authArgs.dms, 4)
    })

    await t.test('calls auth on existing unauthenticated sockets', (t) => {
      t.teardown(teardown)
      t.plan(1)
      let cred = false
      m = new WS2Manager()

      m._sockets = [{
        ws: {
          isAuthenticated: () => false,
          updateAuthArgs: ({ apiKey: key, apiSecret: secret }) => { cred = `${key}:${secret}` },
          auth: () => {
            t.is(cred, '41:42')
          }
        }
      }]

      m.auth({ apiKey: '41', apiSecret: '42' })
    })
  })

  await t.test('openSocket', async (t) => {
    const wss = new MockWSv2Server()
    t.teardown(() => wss.close())

    await t.test('binds listeners to forward events', { timeout: 4000 }, async (t) => {
      t.teardown(teardown)
      const heardEvents = {}
      const events = [
        'open', 'message', 'auth', 'error', 'close', 'subscribed',
        'unsubscribed'
      ]

      m = new WS2Manager({ url: 'ws://localhost:9997' })
      const s = m.openSocket()
      const { ws } = s

      events.forEach(e => {
        m.on(e, () => { heardEvents[e] = true })
      })

      events.forEach(e => ws.emit(e))
      events.forEach(e => {
        t.ok(heardEvents[e])
      })

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    })

    await t.test('saves socket state', { timeout: 4000 }, async (t) => {
      t.teardown(teardown)
      m = new WS2Manager({ url: 'ws://localhost:9997' })
      const s = m.openSocket()
      const { ws } = s

      t.alike(m._sockets[0], s)

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    })

    await t.test('binds \'unsubscribed\' listener to remove channel from pending unsubs', { timeout: 4000 }, async (t) => {
      t.teardown(teardown)
      m = new WS2Manager({ url: 'ws://localhost:9997' })
      const s = m.openSocket()
      const { ws } = s

      s.pendingUnsubscriptions.push(`${42}`)
      s.ws.emit('unsubscribed', { chanId: 42 })

      t.is(s.pendingUnsubscriptions.length, 0)

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    })

    await t.test('binds \'subscribed\' listener to remove channel from pending subs', { timeout: 4000 }, async (t) => {
      t.teardown(teardown)
      m = new WS2Manager({ url: 'ws://localhost:9997' })
      const s = m.openSocket()
      const { ws } = s

      s.pendingSubscriptions.push(['book', { symbol: 'tBTCUSD', prec: 'R0' }])
      s.ws.emit('subscribed', {
        channel: 'book',
        symbol: 'tBTCUSD',
        prec: 'R0',
        len: '25'
      })

      t.is(s.pendingSubscriptions.length, 0)

      return new Promise((resolve, reject) => {
        ws.on('open', () => ws.close().then(resolve).catch(reject))
      })
    })

    await t.test('auto-auths if manager has credentials configured', { timeout: 4000 }, (t) => {
      t.teardown(teardown)
      t.plan(2)
      m = new WS2Manager({
        url: 'ws://localhost:9997',
        apiKey: 'key',
        apiSecret: 'secret'
      })

      const s = m.openSocket()
      const { ws } = s

      ws.auth = async () => {
        t.is(ws._authArgs.apiKey, 'key', 'api key not set')
        t.is(ws._authArgs.apiSecret, 'secret', 'api secret not set')

        await ws.close()
      }
    })
  })

  await t.test('getAuthenticatedSocket', async (t) => {
    await t.test('returns the first authenticated socket found', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()

      for (let i = 0; i < 3; i += 1) {
        m._sockets.push({
          test: i,
          ws: { isAuthenticated: () => i === 1 }
        })
      }

      t.is(m.getAuthenticatedSocket().test, 1, 'did not return correct socket')
    })
  })

  await t.test('getFreeDataSocket', async (t) => {
    await t.test('returns the first socket below the data channel limit', (t) => {
      t.teardown(teardown)
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
      t.alike(s, m._sockets[1])
    })
  })

  await t.test('getSocketWithDataChannel', async (t) => {
    await t.test('returns socket subscribed to specified channel/filter pair', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      m._sockets[0] = {
        ws: {},
        pendingSubscriptions: [['candles', { key: 'test' }]],
        pendingUnsubscriptions: []
      }

      let s = m.getSocketWithDataChannel('candles', { key: 'test' })
      t.alike(s, m._sockets[0])

      /// /
      m._sockets[0] = {
        ws: { getDataChannelId: () => false },
        pendingSubscriptions: [['auth', {}]],
        pendingUnsubscriptions: []
      }

      s = m.getSocketWithDataChannel('candles', { key: 'test' })
      t.ok(!s)

      /// /
      m._sockets[0] = {
        ws: {
          getDataChannelId: (type, filter) => {
            t.is(type, 'candles')
            t.alike(filter, { key: 'test' })
            return 1
          }
        },
        pendingSubscriptions: [],
        pendingUnsubscriptions: []
      }

      s = m.getSocketWithDataChannel('candles', { key: 'test' })
      t.alike(s, m._sockets[0])

      /// /
      m._sockets[0] = {
        ws: {
          getDataChannelId: (type, filter) => {
            t.is(type, 'candles')
            t.alike(filter, { key: 'test' })
            return 1
          }
        },
        pendingSubscriptions: [],
        pendingUnsubscriptions: [1]
      }

      s = m.getSocketWithDataChannel('candles', { key: 'test' })
      t.ok(!s)
    })
  })

  await t.test('getSocketWithChannel', async (t) => {
    await t.test('returns correct socket', (t) => {
      t.teardown(teardown)
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
      t.alike(s, m._sockets[0])

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
      t.ok(!s)
    })
  })

  await t.test('getSocketWithSubRef', async (t) => {
    await t.test('returns the first socket found that has the requested subscription ref', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()

      for (let i = 0; i < 3; i += 1) {
        m._sockets.push({
          test: i,
          ws: {
            hasSubscriptionRef: (channel, identifier) => {
              t.is(channel, 'a', 'did not pass channel through')
              t.is(identifier, 'b', 'did not pass identifier through')
              return i === 1
            }
          }
        })
      }

      const s = m.getSocketWithSubRef('a', 'b')
      t.ok(_isObject(s), 'did not return a socket')
      t.is(s.test, 1, 'did not return correct socket')
    })
  })

  await t.test('subscribe', async (t) => {
    await t.test('delays sub for unopened sockets', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let onceOpenCalled = false

      m._sockets[0] = {
        pendingSubscriptions: [],
        pendingUnsubscriptions: [],
        ws: {
          getDataChannelCount: () => 0,
          managedSubscribe: () => t.ok(false),
          isOpen: () => false,
          once: (eName) => {
            t.is(eName, 'open')
            onceOpenCalled = true
          }
        }
      }

      m.subscribe('candles', 'test', { key: 'test' })
      t.ok(onceOpenCalled)
    })

    await t.test('saves pending sub', (t) => {
      t.teardown(teardown)
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
      t.alike(m._sockets[0].pendingSubscriptions, [
        ['candles', { key: 'test' }]
      ])
    })

    await t.test('opens a new socket if no sockets are available', (t) => {
      t.teardown(teardown)
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
      t.ok(openCalled)
    })

    await t.test('opens a new socket if no sockets are below data limit', (t) => {
      t.teardown(teardown)
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

      t.ok(openCalled)
      t.is(m._sockets.length, 2)
    })
  })

  await t.test('unsubscribe', async (t) => {
    await t.test('saves pending unsub & calls unsub on socket', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let unsubCalled = false

      m._sockets[0] = {
        pendingUnsubscriptions: [],
        ws: {
          unsubscribe: (cid) => {
            t.is(cid, 42)
            unsubCalled = true
          },

          hasChannel: (cid) => {
            return cid === 42
          }
        }
      }

      m.unsubscribe(42)
      t.alike(m._sockets[0].pendingUnsubscriptions, [42])
      t.ok(unsubCalled)
    })
  })

  await t.test('managedUnsubscribe', async (t) => {
    await t.test('saves pending unsub and calls managed unsub on socket', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      let unsubCalled = false

      m._sockets[0] = {
        pendingUnsubscriptions: [],
        ws: {
          managedUnsubscribe: (cid) => {
            t.is(cid, 42)
            unsubCalled = true
          },

          hasSubscriptionRef: (cid) => cid === 42,
          _chanIdByIdentifier: () => 42
        }
      }

      m.managedUnsubscribe(42)
      t.alike(m._sockets[0].pendingUnsubscriptions, [42])
      t.ok(unsubCalled)
    })
  })

  await t.test('withAllSockets', async (t) => {
    await t.test('calls the provided cb with all internal sockets', (t) => {
      t.teardown(teardown)
      m = new WS2Manager()
      const socketsSeen = {}

      m._sockets = ['a', 'b', 'c']
      m.withAllSockets((sock) => {
        socketsSeen[sock] = true
      })

      t.ok(socketsSeen.a)
      t.ok(socketsSeen.b)
      t.ok(socketsSeen.c)
    })
  })

  await t.test('subscribeOrderBook', async (t) => {
    await t.test('calls subscribe with a valid filter and the provided symbol', (t) => {
      t.teardown(teardown)
      t.plan(6)
      m = new WS2Manager()
      m.subscribe = (type, symbol, filter) => {
        t.ok(_isObject(filter), 'filter not an object')
        t.is(filter.symbol, 'tBTCUSD', 'symbol did not match')
        t.is(filter.prec, 'P0', 'prec did not match')
        t.is(filter.len, '25', 'len did not match')
        t.is(filter.freq, 'F0', 'freq did not match')
        t.is(symbol, 'tBTCUSD')
      }

      m.subscribeOrderBook('tBTCUSD', 'P0', '25', 'F0')
    })
  })

  await t.test('onOrderBook', async (t) => {
    await t.test('passes a valid OB filter to the first socket with a book channel', (t) => {
      t.teardown(teardown)
      t.plan(11)
      const assertFilter = (filter) => {
        t.ok(_isObject(filter), 'filter not an object')
        t.is(filter.symbol, 'tBTCUSD', 'symbol did not match')
        t.is(filter.prec, 'P0', 'prec did not match')
        t.is(filter.len, '25', 'len did not match')
        t.is(filter.freq, 'F0', 'freq did not match')
      }

      m = new WS2Manager()
      m._sockets.push({
        pendingSubscriptions: [],
        pendingUnsubscriptions: [],
        ws: {
          getDataChannelId: (type, filter) => {
            t.is(type, 'book')
            assertFilter(filter)
            return 42
          },

          onOrderBook: (filter) => {
            assertFilter(filter)
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
