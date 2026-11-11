'use strict'

const test = require('brittle')
const { SocksProxyAgent } = require('socks-proxy-agent')
const { MockWSv2Server } = require('bfx-api-mock-srv')
const _isFunction = require('lodash/isFunction')
const _isObject = require('lodash/isObject')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')
const _isError = require('lodash/isError')
const _includes = require('lodash/includes')
const {
  Position, FundingOffer, FundingCredit, FundingLoan, Wallet, BalanceInfo,
  MarginInfo, FundingInfo, FundingTrade, Notification, Candle, PublicTrade,
  Trade, TradingTicker, FundingTicker
} = require('bfx-api-node-models')

const WSv2 = require('../../../lib/transports/ws2')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const createTestWSv2Instance = (params = {}) => {
  return new WSv2({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: 'ws://localhost:9997',
    ...params
  })
}

test('WSv2 unit', async (t) => {
  let ws = null
  let wss = null

  const teardown = async () => {
    try { // may fail due to being modified by a test, it's not a problem
      if (ws && ws.isOpen()) {
        await ws.close()
      }
    } catch (e) {}

    if (wss && wss.isOpen()) {
      await wss.close()
    }

    ws = null
    wss = null
  }

  await t.test('event subscribers', async (t) => {
    const testSub = async (name, eventName, filterIndex, filterKey, filterValue, model) => {
      await t.test(name, async (t) => {
        await t.test(`listens for ${eventName} event, passes valid filter, and uses correct model`, (t) => {
          t.teardown(teardown)
          t.plan(1 + (filterIndex === null ? 0 : 1) + (model === null ? 0 : 1))
          ws = createTestWSv2Instance()
          ws._registerListener = (passedEventName, filter, passedModel) => {
            t.is(passedEventName, eventName, 'incorrect event name')

            if (filterIndex !== null) {
              t.alike(filter, { [filterIndex]: filterValue }, 'incorrect filter')
            }

            if (model !== null) {
              t.is(model, passedModel)
            }
          }

          ws[name]({ [filterKey]: filterValue })
        })
      })
    }

    await testSub('onCandle', 'candle', 0, 'key', 'test-key', Candle)
    await testSub('onTrades', 'trades', 0, 'symbol', 'tBTCUSD', PublicTrade)
    await testSub('onTrades', 'trades', 0, 'symbol', 'fUSD', FundingTrade)
    await testSub('onTradeEntry', 'trade-entry', 0, 'symbol', 'tBTCUSD', PublicTrade)
    await testSub('onAccountTradeEntry', 'auth-te', 1, 'symbol', 'tBTCUSD', Trade)
    await testSub('onAccountTradeUpdate', 'auth-tu', 1, 'symbol', 'tBTCUSD', Trade)
    await testSub('onTicker', 'ticker', 0, 'symbol', 'tBTCUSD', TradingTicker)
    await testSub('onTicker', 'ticker', 0, 'symbol', 'fUSD', FundingTicker)
    await testSub('onStatus', 'status', 0, 'key', 'test-key', null)
    await testSub('onPositionSnapshot', 'ps', 0, 'symbol', 'tBTCUSD', Position)
    await testSub('onPositionNew', 'pn', 0, 'symbol', 'tBTCUSD', Position)
    await testSub('onPositionUpdate', 'pu', 0, 'symbol', 'tBTCUSD', Position)
    await testSub('onPositionClose', 'pc', 0, 'symbol', 'tBTCUSD', Position)
    await testSub('onFundingOfferSnapshot', 'fos', 1, 'symbol', 'tBTCUSD', FundingOffer)
    await testSub('onFundingOfferNew', 'fon', 1, 'symbol', 'tBTCUSD', FundingOffer)
    await testSub('onFundingOfferUpdate', 'fou', 1, 'symbol', 'tBTCUSD', FundingOffer)
    await testSub('onFundingOfferClose', 'foc', 1, 'symbol', 'tBTCUSD', FundingOffer)
    await testSub('onFundingCreditSnapshot', 'fcs', 1, 'symbol', 'tBTCUSD', FundingCredit)
    await testSub('onFundingCreditNew', 'fcn', 1, 'symbol', 'tBTCUSD', FundingCredit)
    await testSub('onFundingCreditUpdate', 'fcu', 1, 'symbol', 'tBTCUSD', FundingCredit)
    await testSub('onFundingCreditClose', 'fcc', 1, 'symbol', 'tBTCUSD', FundingCredit)
    await testSub('onFundingLoanSnapshot', 'fls', 1, 'symbol', 'tBTCUSD', FundingLoan)
    await testSub('onFundingLoanNew', 'fln', 1, 'symbol', 'tBTCUSD', FundingLoan)
    await testSub('onFundingLoanUpdate', 'flu', 1, 'symbol', 'tBTCUSD', FundingLoan)
    await testSub('onFundingLoanClose', 'flc', null, null, null, FundingLoan)
    await testSub('onWalletSnapshot', 'ws', null, null, null, Wallet)
    await testSub('onWalletUpdate', 'wu', null, null, null, Wallet)
    await testSub('onBalanceInfoUpdate', 'bu', null, null, null, BalanceInfo)
    await testSub('onMarginInfoUpdate', 'miu', null, null, null, MarginInfo)
    await testSub('onFundingInfoUpdate', 'fiu', null, null, null, FundingInfo)
    await testSub('onFundingTradeEntry', 'fte', 0, 'symbol', 'tBTCUSD', FundingTrade)
    await testSub('onFundingTradeUpdate', 'ftu', 0, 'symbol', 'tBTCUSD', FundingTrade)
    await testSub('onNotification', 'n', 1, 'type', 'oc-req', Notification)
  })

  await t.test('utilities', async (t) => {
    await t.test('sendEnabledFlags: sends the current flags value to the server', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()

      await ws.open()

      ws._enabledFlags = WSv2.flags.CHECKSUM

      return new Promise((resolve) => {
        ws.send = (packet) => {
          t.is(packet.event, 'conf')
          t.is(packet.flags, WSv2.flags.CHECKSUM)
          resolve()
        }

        ws.sendEnabledFlags()
      })
    })

    await t.test('enableFlag: saves enabled flag status', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      t.ok(!ws.isFlagEnabled(WSv2.flags.SEQ_ALL))
      t.ok(!ws.isFlagEnabled(WSv2.flags.CHECKSUM))

      ws.enableFlag(WSv2.flags.SEQ_ALL)

      t.ok(ws.isFlagEnabled(WSv2.flags.SEQ_ALL))
      t.ok(!ws.isFlagEnabled(WSv2.flags.CHECKSUM))

      ws.enableFlag(WSv2.flags.CHECKSUM)

      t.ok(ws.isFlagEnabled(WSv2.flags.SEQ_ALL))
      t.ok(ws.isFlagEnabled(WSv2.flags.CHECKSUM))
    })

    await t.test('enableFlag: sends conf packet if open', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()

      await ws.open()

      return new Promise((resolve) => {
        ws.send = (packet) => {
          t.ok(_isObject(packet))
          t.is(packet.event, 'conf')
          resolve()
        }

        ws.enableFlag(WSv2.flags.SEQ_ALL)
      })
    })

    await t.test('_registerListener: correctly adds listener to internal map with cbGID', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._registerListener('trade', { 2: 'tBTCUSD' }, Map, 42, () => { })

      const { _listeners } = ws

      t.is(Object.keys(_listeners).length, 1)
      t.is(+Object.keys(_listeners)[0], 42)
      t.is(typeof _listeners[42], 'object')

      const listenerSet = _listeners[42]

      t.is(Object.keys(listenerSet).length, 1)
      t.is(Object.keys(listenerSet)[0], 'trade')
      t.is(listenerSet.trade.constructor.name, 'Array')
      t.is(listenerSet.trade.length, 1)

      const listener = listenerSet.trade[0]

      t.is(listener.modelClass, Map)
      t.alike(listener.filter, { 2: 'tBTCUSD' })
      t.is(typeof listener.cb, 'function')
    })

    await t.test('sequencingEnabled: returns sequencing status', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance({ seqAudit: false })

      t.ok(_isFunction(ws.sequencingEnabled), 'WSv2 does not provide sequencingEnabled()')
      t.ok(!ws.sequencingEnabled(), 'sequencing enabled even though disabled in constructor')
      ws.enableSequencing()
      t.ok(ws.sequencingEnabled(), 'sequencing status not reported by getter')
    })

    await t.test('enableSequencing: sends the correct conf flag', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()
      let packetSent = false

      await ws.open()

      ws.send = (packet) => {
        t.is(packet.event, 'conf')
        t.is(packet.flags, 65536)
        packetSent = true
      }

      ws.enableSequencing()

      t.ok(packetSent)
    })

    await t.test('getCandles: returns empty array if no candle set is available', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      t.alike(ws.getCandles('i.dont.exist'), [])
    })

    await t.test('_sendCalc: stringifes payload & passes it to the ws client', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()

      ws._ws = {}
      ws._ws.send = (data) => {
        t.is(data, '[]')
      }

      ws._sendCalc([])
    })

    await t.test('notifyUI: throws error if supplied invalid arguments', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      t.exception.all(() => ws.notifyUI())
      t.exception.all(() => ws.notifyUI(null))
      t.exception.all(() => ws.notifyUI(null, null))
    })

    await t.test('notifyUI: throws error if socket closed or not authenticated', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      const n = { type: 'info', message: 'test' }

      t.exception.all(() => ws.notifyUI(n))
      ws._isOpen = true
      t.exception.all(() => ws.notifyUI(n))
      ws._isAuthenticated = true
      ws.send = () => { }
      t.execution(() => ws.notifyUI(n))
    })

    await t.test('notifyUI: sends the correct UCM broadcast notification', (t) => {
      t.teardown(teardown)
      t.plan(8)
      ws = createTestWSv2Instance()
      ws._isOpen = true
      ws._isAuthenticated = true
      ws.send = (msg = []) => {
        t.alike(msg[0], 0)
        t.alike(msg[1], 'n')
        t.alike(msg[2], null)

        const data = msg[3]

        t.ok(_isObject(data))
        t.alike(data.type, 'ucm-notify-ui')
        t.ok(_isObject(data.info))
        t.alike(data.info.type, 'success')
        t.alike(data.info.message, '42')
      }

      ws.notifyUI({ type: 'success', message: '42' })
    })
  })

  await t.test('lifetime', async (t) => {
    await t.test('starts unopened & unauthenticated', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      t.is(ws.isOpen(), false)
      t.is(ws.isAuthenticated(), false)
    })

    await t.test('open: fails to open twice', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      try {
        await ws.open()
        t.ok(false)
      } catch (e) {
        t.ok(true, 'failed to open twice')
      }
    })

    await t.test('open: updates open flag', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      t.is(ws.isOpen(), true)
    })

    await t.test('open: sends flags value', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()
      let flagsSent = false

      ws.enableSequencing()
      ws.sendEnabledFlags = () => {
        t.is(ws._enabledFlags, WSv2.flags.SEQ_ALL)
        flagsSent = true
      }

      await ws.open()

      t.ok(flagsSent)
    })

    await t.test('close: doesn\'t close if not open', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      try {
        await ws.close()
        t.ok(false)
      } catch (e) {
        t.ok(true, 'did not close due to being open')
      }
    })

    await t.test('close: fails to close twice', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      return new Promise((resolve) => {
        ws.on('close', async () => {
          try {
            await ws.close()
            t.ok(false)
          } catch (e) {
            resolve()
          }
        })

        return ws.close()
      })
    })

    await t.test('close: clears connection state', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()
      ws._onWSClose = () => { } // disable fallback reset

      await ws.open()

      t.ok(ws._ws !== null)
      t.ok(ws._isOpen)

      await ws.close()

      t.ok(ws._ws == null)
      t.ok(!ws._isOpen)
    })

    await t.test('auth: fails to auth twice', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()
      await ws.auth()

      try {
        await ws.auth()
        t.ok(false)
      } catch (e) {
        t.ok(true, 'failed to auth twice')
      }
    })

    await t.test('auth: updates auth flag', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()
      await ws.auth()

      t.ok(ws.isAuthenticated())
    })

    await t.test('auth: forwards calc param', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()
      let sentCalc = false

      await ws.open()

      const send = ws.send
      ws.send = (data) => {
        t.is(data.calc, 42)
        sentCalc = true

        ws.send = send
        ws.send(data)
      }

      await ws.auth(42)

      t.ok(sentCalc)
    })

    await t.test('auth: forwards dms param', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()
      let sentDMS = false

      await ws.open()

      const send = ws.send
      ws.send = (data) => {
        t.is(data.dms, 42)
        sentDMS = true

        ws.send = send
        ws.send(data)
      }

      await ws.auth(0, 42)

      t.ok(sentDMS)
    })

    await t.test('reconnect: connects if not already connected', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      let sawClose = false
      let sawOpen = false

      ws.on('close', () => { sawClose = true })
      ws.on('open', () => { sawOpen = true })

      await ws.reconnect()

      t.ok(!sawClose)
      t.ok(sawOpen)
    })

    await t.test('reconnect: disconnects & connects back if currently connected', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      let sawClose = false
      let sawOpen = false

      ws.on('close', () => { sawClose = true })
      ws.on('open', () => { sawOpen = true })

      await ws.reconnect()

      t.ok(sawClose)
      t.ok(sawOpen)
      t.ok(ws.isOpen())
    })

    await t.test('reconnect: automatically auths on open if previously authenticated', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      let closed = false
      let opened = false
      let authenticated = false

      ws.on('error', (error) => {
        throw error
      })

      await ws.open()
      await ws.auth()

      ws.once('close', () => { closed = true })
      ws.once('open', () => { opened = true })
      ws.once('auth', () => { authenticated = true })

      await ws.reconnect()

      t.ok(closed)
      t.ok(opened)
      t.ok(authenticated)
    })
  })

  await t.test('constructor', async (t) => {
    await t.test('defaults to production WS url', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance({ url: undefined })
      t.not(ws._url.indexOf('api.bitfinex.com'), -1)
    })

    await t.test('defaults to no transform', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      const transWS = createTestWSv2Instance({ transform: true })
      t.is(ws._transform, false)
      t.is(transWS._transform, true)
    })
  })

  await t.test('auto reconnect', async (t) => {
    await t.test('reconnects on close if autoReconnect is enabled', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance({ autoReconnect: true })

      await ws.open()
      await ws.auth()

      return new Promise((resolve) => {
        ws.reconnectAfterClose = Promise.resolve(resolve())
        wss.close() // trigger reconnect
      })
    })

    await t.test('respects reconnectDelay', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance({
        autoReconnect: true,
        reconnectDelay: 75
      })

      await ws.open()
      await ws.auth()

      return new Promise((resolve) => {
        const now = Date.now()

        ws.reconnectAfterClose = () => {
          t.ok((Date.now() - now) >= 70)
          resolve()

          return Promise.resolve()
        }

        wss.close() // trigger reconnect
      })
    })

    await t.test('does not auto-reconnect if explicity closed', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance({
        autoReconnect: true
      })

      await ws.open()
      await ws.auth()

      ws.reconnect = async () => t.ok(false)
      await ws.close()

      await new Promise(resolve => setTimeout(resolve, 50))
    })
  })

  await t.test('reconnect with new credentials', async (t) => {
    t.teardown(teardown)
    wss = new MockWSv2Server({ authMiddleware: ({ apiKey }) => apiKey === API_KEY })
    ws = createTestWSv2Instance({ reconnectDelay: 10 })

    await ws.open()
    await ws.auth()
    t.ok(ws.isAuthenticated())

    ws.updateAuthArgs({ apiKey: 'wrong', apiSecret: 'wrong' })
    ws.reconnect()
    await new Promise(resolve => setTimeout(resolve, 50))
    t.ok(!ws.isAuthenticated())

    ws.updateAuthArgs({ apiKey: API_KEY, apiSecret: API_SECRET })
    ws.reconnect()
    await new Promise(resolve => setTimeout(resolve, 50))
    t.ok(ws.isAuthenticated())
  })

  await t.test('seq audit', async (t) => {
    await t.test('automatically enables sequencing if seqAudit is true in constructor', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance({ seqAudit: true })
      t.ok(ws.isFlagEnabled(WSv2.flags.SEQ_ALL))
    })

    await t.test('emits error on invalid seq number', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance({ seqAudit: true })

      let errorsSeen = 0

      await ws.open()
      await ws.auth()

      ws.on('error', (err) => {
        if (_includes(err.message, 'seq #')) errorsSeen++

        return null
      })

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

      t.is(errorsSeen, 6)
    })
  })

  await t.test('ws event handlers', async (t) => {
    await t.test('_onWSOpen: updates open flag', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      t.ok(!ws.isOpen())
      ws._onWSOpen()
      t.ok(ws.isOpen())
    })

    await t.test('_onWSClose: updates open flag', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._onWSOpen()
      t.ok(ws.isOpen())
      ws._onWSClose()
      t.ok(!ws.isOpen())
    })

    await t.test('_onWSError: emits error', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.on('error', () => t.pass())
      ws._onWSError(new Error())
    })

    await t.test('_onWSMessage: emits error on invalid packet', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.on('error', () => t.pass())
      ws._onWSMessage('I can\'t believe it\'s not JSON!')
    })

    await t.test('_onWSMessage: emits message', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      const msg = [1]
      const flags = 'flags'
      let messageSeen = false

      ws.on('message', (m) => {
        t.alike(m, msg)
        t.is(flags, 'flags')
        messageSeen = true
      })

      ws._onWSMessage(JSON.stringify(msg), flags)
      t.ok(messageSeen)
    })

    await t.test('_onWSNotification: triggers event callbacks for new orders', (t) => {
      t.teardown(teardown)
      t.plan(5)
      ws = createTestWSv2Instance()
      const kNew = 'order-new-42'

      ws._eventCallbacks.push(kNew, (err, order) => {
        t.ok(!err)
        t.ok(order)
        t.alike(order, [0, 0, 42])

        ws._eventCallbacks.push(kNew, (err, order) => {
          t.ok(err)
          t.alike(order, [0, 0, 42])
        })

        ws._onWSNotification([0, 'on-req', null, null, [0, 0, 42], 0, 'ERROR'])
      })

      ws._onWSNotification([0, 'on-req', null, null, [0, 0, 42], 0, 'SUCCESS'])
    })

    await t.test('_onWSNotification: triggers event callbacks for cancelled orders', (t) => {
      t.teardown(teardown)
      t.plan(5)
      ws = createTestWSv2Instance()
      const kCancel = 'order-cancel-42'

      ws._eventCallbacks.push(kCancel, (err, order) => {
        t.ok(!err)
        t.ok(order)
        t.alike(order, [42])

        ws._eventCallbacks.push(kCancel, (err, order) => {
          t.ok(err)
          t.alike(order, [42])
        })

        ws._onWSNotification([0, 'oc-req', null, null, [42], 0, 'ERROR'])
      })

      ws._onWSNotification([0, 'oc-req', null, null, [42], 0, 'SUCCESS'])
    })
  })

  await t.test('WSv2 channel msg handling', async (t) => {
    await t.test('_handleChannelMessage: emits message', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      const packet = [42, 'tu', []]
      let packetSeen = false

      ws._channelMap = {
        42: { channel: 'meaning' }
      }

      ws.on('meaning', (msg) => {
        t.alike(msg, packet)
        packetSeen = true
      })

      ws._handleChannelMessage(packet)
      t.ok(packetSeen)
    })

    await t.test('_handleChannelMessage: calls all registered listeners (nofilter)', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._channelMap = { 0: { channel: 'auth' } }
      let called = 0
      ws.onWalletUpdate({}, () => {
        if (++called === 2) t.pass()
      })

      ws.onWalletUpdate({}, () => {
        if (++called === 2) t.pass()
      })

      ws._handleChannelMessage([0, 'wu', []])
    })

    const doFilterTest = (transform, t) => {
      ws = new WSv2({ transform })
      ws._channelMap = { 0: { channel: 'auth' } }
      let calls = 0
      let btcListenerCalled = false

      ws.onAccountTradeEntry({ symbol: 'tBTCUSD' }, () => {
        t.ok(!btcListenerCalled)
        btcListenerCalled = true

        if (++calls === 7) t.pass()
      })

      ws.onAccountTradeEntry({}, () => {
        if (++calls === 7) t.pass()
      })

      ws.onAccountTradeEntry({}, () => {
        if (++calls === 7) t.pass()
      })

      ws._handleChannelMessage([0, 'te', [123, 'tETHUSD']])
      ws._handleChannelMessage([0, 'te', [123, 'tETHUSD']])
      ws._handleChannelMessage([0, 'te', [123, 'tBTCUSD']])
    }

    await t.test('_handleChannelMessage: filters messages if listeners require it (transform)', (t) => {
      t.teardown(teardown)
      t.plan(2)
      doFilterTest(true, t)
    })

    await t.test('_handleChannelMessage: filters messages if listeners require it (no transform)', (t) => {
      t.teardown(teardown)
      t.plan(2)
      doFilterTest(false, t)
    })

    await t.test('_handleChannelMessage: transforms payloads if enabled', (t) => {
      t.teardown(teardown)
      t.plan(14)

      const wsTransform = new WSv2({ transform: true })
      const wsNoTransform = new WSv2({ transform: false })
      wsTransform._channelMap = { 0: { channel: 'auth' } }
      wsNoTransform._channelMap = { 0: { channel: 'auth' } }

      const tradeData = [
        0, 'tBTCUSD', Date.now(), 0, 0.1, 1, 'type', 1, false, 0.001, 'USD'
      ]

      wsNoTransform.onAccountTradeUpdate({}, (trade) => {
        t.is(trade.constructor.name, 'Array')
        t.alike(trade, tradeData)
      })

      wsTransform.onAccountTradeUpdate({}, (trade) => {
        t.is(trade.constructor.name, 'Trade')
        t.is(trade.id, tradeData[0])
        t.is(trade.symbol, tradeData[1])
        t.is(trade.mtsCreate, tradeData[2])
        t.is(trade.orderID, tradeData[3])
        t.is(trade.execAmount, tradeData[4])
        t.is(trade.execPrice, tradeData[5])
        t.is(trade.orderType, tradeData[6])
        t.is(trade.orderPrice, tradeData[7])
        t.is(trade.maker, tradeData[8])
        t.is(trade.fee, tradeData[9])
        t.is(trade.feeCurrency, tradeData[10])
      })

      wsTransform._handleChannelMessage([0, 'tu', tradeData])
      wsNoTransform._handleChannelMessage([0, 'tu', tradeData])
    })

    await t.test('onMessage: calls the listener with all messages (no filter)', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._channelMap = { 0: { channel: 'auth' } }

      let calls = 0

      ws.onMessage({}, () => {
        if (++calls === 2) t.pass()
      })

      ws._handleChannelMessage([0, 'wu', []])
      ws._handleChannelMessage([0, 'tu', []])
    })

    await t.test('_payloadPassesFilter: correctly detects matching payloads', (t) => {
      t.teardown(teardown)
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

      goodPayloads.forEach(p => t.ok(WSv2._payloadPassesFilter(p, filter)))
      badPayloads.forEach(p => t.ok(!WSv2._payloadPassesFilter(p, filter)))
    })

    await t.test('_payloadPassesFilter: ignores filter if empty', (t) => {
      t.teardown(teardown)
      const filterUndefined = { 1: undefined }
      const filterNull = { 1: null }
      const filterEmpty = { 1: '' }
      const payload = [0, 'tBTCUSD', 42, '']

      t.ok(WSv2._payloadPassesFilter(payload, filterUndefined))
      t.ok(WSv2._payloadPassesFilter(payload, filterNull))
      t.ok(WSv2._payloadPassesFilter(payload, filterEmpty))
    })

    await t.test('_payloadPassesFilter: ignores filter if *', (t) => {
      t.teardown(teardown)
      const filter = { 1: '*' }
      const payload = [0, 'tBTCUSD', 42, '']

      t.ok(WSv2._payloadPassesFilter(payload, filter))
    })

    await t.test('_notifyListenerGroup: notifies all matching listeners in the group', (t) => {
      t.teardown(teardown)
      t.plan(2)
      let calls = 0
      const func = () => {
        t.ok(calls < 3)
        calls++
      }

      const lg = {
        '': [{ cb: func }],
        test: [{ cb: func }],
        nope: [{ cb: func }]
      }

      WSv2._notifyListenerGroup(lg, [0, 'test', [0, 'tu']], false)
    })

    await t.test('_notifyListenerGroup: doesn\'t fail on missing data if filtering', (t) => {
      t.teardown(teardown)
      t.plan(1)
      const lg = {
        test: [{
          filter: { 1: 'on' },
          cb: () => {
            t.fail('filter should not have matched')
          }
        }]
      }

      WSv2._notifyListenerGroup(lg, [0, 'test'], false)
      t.pass()
    })

    await t.test('_propagateMessageToListeners: notifies all matching listeners', (t) => {
      t.teardown(teardown)
      const ws = createTestWSv2Instance()
      let seenMessage = false
      ws._channelMap = { 0: { channel: 'auth' } }

      ws.onAccountTradeEntry({ symbol: 'tBTCUSD' }, () => {
        seenMessage = true
      })

      ws._propagateMessageToListeners([0, 'auth-te', [123, 'tBTCUSD']])
      t.ok(seenMessage)
    })

    await t.test('_notifyCatchAllListeners: passes data to all listeners on the empty \'\' event', (t) => {
      t.teardown(teardown)
      let s = 0

      const lg = {
        '': [
          { cb: d => { s += d } },
          { cb: d => { s += (d * 2) } }
        ]
      }

      WSv2._notifyCatchAllListeners(lg, 5)
      t.is(s, 15)
    })

    await t.test('_handleOBMessage: maintains internal OB if management is enabled', (t) => {
      t.teardown(teardown)
      ws = new WSv2({
        manageOrderBooks: true,
        transform: true
      })

      ws._channelMapA = {
        42: {
          channel: 'orderbook',
          symbol: 'tBTCUSD'
        }
      }
      ws._channelMapB = {
        43: {
          channel: 'orderbook',
          symbol: 'fUSD'
        }
      }

      let obMsg = [42, [
        [100, 2, -4],
        [200, 4, -8],
        [300, 1, 3]
      ]]

      ws._handleOBMessage(obMsg, ws._channelMapA[42], JSON.stringify(obMsg))

      obMsg = [43, [
        [0.0008, 2, 5, 200],
        [0.00045, 30, 4, -300],
        [0.0004, 15, 3, -600]
      ]]

      ws._handleOBMessage(obMsg, ws._channelMapB[43], JSON.stringify(obMsg))

      let obA = ws.getOB('tBTCUSD')
      let obB = ws.getOB('fUSD')

      t.ok(obA !== null)
      t.ok(obB !== null)

      t.is(obA.bids.length, 1)
      t.is(obB.bids.length, 2)
      t.alike(obA.bids, [[300, 1, 3]])
      t.alike(obB.bids, [[0.00045, 30, 4, -300], [0.0004, 15, 3, -600]])
      t.is(obA.asks.length, 2)
      t.is(obB.asks.length, 1)
      t.alike(obA.getEntry(100), { price: 100, count: 2, amount: -4 })
      t.alike(obA.getEntry(200), { price: 200, count: 4, amount: -8 })
      t.alike(obB.getEntry(0.00045), { rate: 0.00045, count: 4, amount: -300, period: 30 })
      t.alike(obB.getEntry(0.0008), { rate: 0.0008, count: 5, amount: 200, period: 2 })

      obMsg = [42, [300, 0, 1]]
      ws._handleOBMessage(obMsg, ws._channelMapA[42], JSON.stringify(obMsg))
      obA = ws.getOB('tBTCUSD')
      t.is(obA.bids.length, 0)
      obMsg = [43, [0.0008, 2, 0, 1]]
      ws._handleOBMessage(obMsg, ws._channelMapB[43], JSON.stringify(obMsg))
      obB = ws.getOB('fUSD')
      t.is(obB.asks.length, 0)
    })

    await t.test('_handleOBMessage: emits error on internal OB update failure', (t) => {
      t.teardown(teardown)
      t.plan(1)
      const wsNoTransform = new WSv2({ manageOrderBooks: true })
      const wsTransform = new WSv2({
        manageOrderBooks: true,
        transform: true
      })

      wsNoTransform._channelMap = {
        42: {
          channel: 'orderbook',
          symbol: 'tBTCUSD'
        }
      }

      wsTransform._channelMap = wsNoTransform._channelMap

      let errorsSeen = 0

      wsNoTransform.on('error', () => {
        if (++errorsSeen === 2) t.pass()
      })

      wsTransform.on('error', () => {
        if (++errorsSeen === 2) t.pass()
      })

      const obMsg = [42, [100, 0, 1]]
      wsTransform._handleOBMessage(obMsg, wsTransform._channelMap[42], JSON.stringify(obMsg))
      wsNoTransform._handleOBMessage(obMsg, wsNoTransform._channelMap[42], JSON.stringify(obMsg))
    })

    await t.test('_handleOBMessage: forwards managed ob to listeners', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = new WSv2({ manageOrderBooks: true })
      ws._channelMap = {
        42: {
          channel: 'orderbook',
          symbol: 'tBTCUSD'
        }
      }

      ws.onOrderBook({ symbol: 'tBTCUSD' }, (ob) => {
        t.alike(ob, [[100, 2, 3]])
      })

      ws.onOrderBook({}, (ob) => {
        t.alike(ob, [[100, 2, 3]])
      })

      const obMsg = [42, [[100, 2, 3]]]
      ws._handleOBMessage(obMsg, ws._channelMap[42], JSON.stringify(obMsg))
    })

    await t.test('_handleOBMessage: filters by prec and len', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = new WSv2({ manageOrderBooks: true })
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
      ws.onOrderBook({ symbol: 'tBTCUSD', prec: 'P0' }, () => {
        t.ok(false)
      })

      ws.onOrderBook({ symbol: 'tBTCUSD', prec: 'P1' }, () => {
        t.ok(false)
      })

      ws.onOrderBook({ symbol: 'tBTCUSD', prec: 'P2' }, () => {
        if (++seen === 2) t.pass()
      })

      const obMsg = [42, [[100, 2, 3]]]
      ws._handleOBMessage(obMsg, ws._channelMap[42], JSON.stringify(obMsg))
      ws._handleOBMessage(obMsg, ws._channelMap[42], JSON.stringify(obMsg))
    })

    await t.test('_handleOBMessage: emits managed ob', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = new WSv2({ manageOrderBooks: true })
      ws._channelMap = {
        42: {
          channel: 'orderbook',
          symbol: 'tBTCUSD'
        }
      }

      ws.on('orderbook', (symbol, data) => {
        t.is(symbol, 'tBTCUSD')
        t.alike(data, [[100, 2, 3]])
      })

      const obMsg = [42, [[100, 2, 3]]]
      ws._handleOBMessage(obMsg, ws._channelMap[42], JSON.stringify(obMsg))
    })

    await t.test('_handleOBMessage: forwards transformed data if transform enabled', (t) => {
      t.teardown(teardown)
      t.plan(4)
      ws = new WSv2({ transform: true })
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'orderbook',
          symbol: 'tBTCUSD'
        }
      }

      ws.onOrderBook({ symbol: 'tBTCUSD' }, (ob) => {
        t.ok(ob.asks)
        t.ok(ob.bids)
        t.is(ob.asks.length, 0)
        t.alike(ob.bids, [[100, 2, 3]])
      })

      const obMsg = [42, [[100, 2, 3]]]
      ws._handleOBMessage(obMsg, ws._channelMap[42], obMsg)
    })

    await t.test('_updateManagedOB: does nothing on rm non-existent entry', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._orderBooks.tBTCUSD = [
        [100, 1, 1],
        [200, 2, 1]
      ]
      ws._losslessOrderBooks.tBTCUSD = [
        ['100', '1', '1'],
        ['200', '2', '1']
      ]

      const err = ws._updateManagedOB('tBTCUSD', [150, 0, -1], false, JSON.stringify([1, [150, 0, -1]]))
      t.is(err, null)
      t.alike(ws._orderBooks.tBTCUSD, [
        [100, 1, 1],
        [200, 2, 1]
      ])
    })

    await t.test('_updateManagedOB: correctly maintains transformed OBs', (t) => {
      t.teardown(teardown)
      ws = new WSv2({ transform: true })
      ws._orderBooks.tBTCUSD = []
      ws._losslessOrderBooks.tBTCUSD = []

      // symbol, data, raw, rawMsg
      t.ok(!ws._updateManagedOB('tBTCUSD', [100, 1, 1], false, JSON.stringify([1, [100, 1, 1]])))
      t.ok(!ws._updateManagedOB('tBTCUSD', [200, 1, -1], false, JSON.stringify([1, [200, 1, -1]])))
      t.ok(!ws._updateManagedOB('tBTCUSD', [200, 0, -1], false, JSON.stringify([1, [200, 0, -1]])))

      const ob = ws.getOB('tBTCUSD')

      t.is(ob.bids.length, 1)
      t.is(ob.asks.length, 0)
      t.alike(ob.bids, [[100, 1, 1]])
    })

    await t.test('_updateManagedOB: correctly maintains non-transformed OBs', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._orderBooks.tBTCUSD = []
      ws._losslessOrderBooks.tBTCUSD = []

      t.ok(!ws._updateManagedOB('tBTCUSD', [100, 1, 1], false, JSON.stringify([1, [100, 1, 1]])))
      t.ok(!ws._updateManagedOB('tBTCUSD', [200, 1, -1], false, JSON.stringify([1, [200, 1, -1]])))
      t.ok(!ws._updateManagedOB('tBTCUSD', [200, 0, -1], false, JSON.stringify([1, [200, 0, -1]])))

      const ob = ws._orderBooks.tBTCUSD

      t.is(ob.length, 1)
      t.alike(ob, [[100, 1, 1]])
    })

    await t.test('_handleCandleMessage: maintains internal candles if management is enabled', (t) => {
      t.teardown(teardown)
      ws = new WSv2({ manageCandles: true })
      ws._channelMap = {
        64: {
          channel: 'candles',
          key: 'trade:1m:tBTCUSD'
        }
      }

      ws._handleCandleMessage([64, [
        [5, 100, 70, 150, 30, 1000],
        [2, 200, 90, 150, 30, 1000],
        [1, 130, 90, 150, 30, 1000],
        [4, 104, 80, 150, 30, 1000]
      ]], ws._channelMap[64])

      const candles = ws._candles['trade:1m:tBTCUSD']

      // maintains sort
      t.is(candles.length, 4)
      t.is(candles[0][0], 5)
      t.is(candles[1][0], 4)
      t.is(candles[2][0], 2)
      t.is(candles[3][0], 1)

      // updates existing candle
      ws._handleCandleMessage([
        64,
        [5, 200, 20, 220, 20, 2000]
      ], ws._channelMap[64])

      t.alike(candles[0], [5, 200, 20, 220, 20, 2000])

      // inserts new candle
      ws._handleCandleMessage([
        64,
        [10, 300, 20, 450, 10, 4000]
      ], ws._channelMap[64])

      t.alike(candles[0], [10, 300, 20, 450, 10, 4000])
    })

    await t.test('_handleCandleMessage: emits error on internal candle update failure', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = new WSv2({ manageCandles: true })
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
        if (++errorsSeen === 1) t.pass()
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

    await t.test('_handleCandleMessage: forwards managed candles to listeners', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = new WSv2({ manageCandles: true })
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'candles',
          key: 'trade:1m:tBTCUSD'
        }
      }

      ws.onCandle({ key: 'trade:1m:tBTCUSD' }, (data) => {
        t.alike(data, [[5, 10, 70, 150, 30, 10]])
      })

      ws.onCandle({}, (data) => {
        t.alike(data, [[5, 10, 70, 150, 30, 10]])
      })

      ws._handleCandleMessage([
        42,
        [[5, 10, 70, 150, 30, 10]]
      ], ws._channelMap[42])
    })

    await t.test('_handleCandleMessage: emits managed candles', (t) => {
      t.teardown(teardown)
      let seenCandle = false
      ws = new WSv2({ manageCandles: true })
      ws._channelMap = {
        42: {
          channel: 'candles',
          key: 'trade:1m:tBTCUSD'
        }
      }

      ws.on('candle', (data, key) => {
        t.is(key, 'trade:1m:tBTCUSD')
        t.alike(data, [[5, 10, 70, 150, 30, 10]])
        seenCandle = true
      })

      ws._handleCandleMessage([
        42,
        [[5, 10, 70, 150, 30, 10]]
      ], ws._channelMap[42])

      t.ok(seenCandle)
    })

    await t.test('_handleCandleMessage: forwards transformed data if transform enabled', (t) => {
      t.teardown(teardown)
      let seenCandle = false
      ws = new WSv2({ transform: true })
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'candles',
          key: 'trade:1m:tBTCUSD'
        }
      }

      ws.onCandle({ key: 'trade:1m:tBTCUSD' }, (candles) => {
        t.is(candles.length, 1)
        t.alike(candles[0], {
          mts: 5,
          open: 10,
          close: 70,
          high: 150,
          low: 30,
          volume: 10
        })

        seenCandle = true
      })

      ws._handleCandleMessage([
        42,
        [[5, 10, 70, 150, 30, 10]]
      ], ws._channelMap[42])

      t.ok(seenCandle)
    })

    await t.test('_updateManagedCandles: returns an error on update for unknown key', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._candles['trade:1m:tBTCUSD'] = []

      const err = ws._updateManagedCandles('trade:30m:tBTCUSD', [
        1, 10, 70, 150, 30, 10
      ])

      t.ok(err)
      t.ok(_isError(err))
    })

    await t.test('_updateManagedCandles: correctly maintains transformed OBs', (t) => {
      t.teardown(teardown)
      ws = new WSv2({ transform: true })

      t.ok(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        [1, 10, 70, 150, 30, 10],
        [2, 10, 70, 150, 30, 10]
      ]))

      t.ok(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        2, 10, 70, 150, 30, 500
      ]))

      t.ok(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        3, 100, 70, 150, 30, 10
      ]))

      const candles = ws._candles['trade:1m:tBTCUSD']

      t.is(candles.length, 3)
      t.alike(candles[0], [
        3, 100, 70, 150, 30, 10
      ])

      t.alike(candles[1], [
        2, 10, 70, 150, 30, 500
      ])

      t.alike(candles[2], [
        1, 10, 70, 150, 30, 10
      ])
    })

    await t.test('_updateManagedCandles: correctly maintains non-transformed OBs', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      t.ok(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        [1, 10, 70, 150, 30, 10],
        [2, 10, 70, 150, 30, 10]
      ]))

      t.ok(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        2, 10, 70, 150, 30, 500
      ]))

      t.ok(!ws._updateManagedCandles('trade:1m:tBTCUSD', [
        3, 100, 70, 150, 30, 10
      ]))

      const candles = ws._candles['trade:1m:tBTCUSD']

      t.is(candles.length, 3)
      t.alike(candles[0], [
        3, 100, 70, 150, 30, 10
      ])

      t.alike(candles[1], [
        2, 10, 70, 150, 30, 500
      ])

      t.alike(candles[2], [
        1, 10, 70, 150, 30, 10
      ])
    })
  })

  await t.test('event msg handling', async (t) => {
    await t.test('_handleErrorEvent: emits error', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.on('error', (err) => {
        if (err === 42) t.pass()
      })
      ws._handleErrorEvent(42)
    })

    await t.test('_handleConfigEvent: emits error if config failed', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.on('error', (err) => {
        if (_includes(err.message, '42')) t.pass()
      })
      ws._handleConfigEvent({ status: 'bad', flags: 42 })
    })

    await t.test('_handleAuthEvent: emits an error on auth fail', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.on('error', () => {
        t.pass()
      })
      ws._handleAuthEvent({ status: 'FAIL' })
    })

    await t.test('_handleAuthEvent: updates auth flag on auth success', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      t.ok(!ws.isAuthenticated())
      ws._handleAuthEvent({ status: 'OK' })
      t.ok(ws.isAuthenticated())
    })

    await t.test('_handleAuthEvent: adds auth channel to channel map', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      t.ok(Object.keys(ws._channelMap).length === 0)
      ws._handleAuthEvent({ chanId: 42, status: 'OK' })
      t.ok(ws._channelMap[42])
      t.is(ws._channelMap[42].channel, 'auth')
    })

    await t.test('_handleAuthEvent: emits auth message', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = createTestWSv2Instance()
      ws.once('auth', (msg) => {
        t.is(msg.chanId, 0)
        t.is(msg.status, 'OK')
      })
      ws._handleAuthEvent({ chanId: 0, status: 'OK' })
    })

    await t.test('_handleSubscribedEvent: adds channel to channel map', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      t.ok(Object.keys(ws._channelMap).length === 0)
      ws._handleSubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
      t.ok(ws._channelMap[42])
      t.is(ws._channelMap[42].chanId, 42)
      t.is(ws._channelMap[42].channel, 'test')
      t.is(ws._channelMap[42].extra, 'stuff')
    })

    await t.test('_handleUnsubscribedEvent: removes channel from channel map', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      t.ok(Object.keys(ws._channelMap).length === 0)
      ws._handleSubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
      ws._handleUnsubscribedEvent({ chanId: 42, channel: 'test', extra: 'stuff' })
      t.ok(Object.keys(ws._channelMap).length === 0)
    })

    await t.test('_handleInfoEvent: passes message to relevant listeners (raw access)', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      let n = 0

      ws._infoListeners[42] = [
        () => { n += 1 },
        () => { n += 2 }
      ]

      ws._handleInfoEvent({ code: 42 })

      t.is(n, 3)
    })

    await t.test('_handleInfoEvent: passes message to relevant listeners', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      let n = 0

      ws.onInfoMessage(42, () => { n += 1 })
      ws.onInfoMessage(42, () => { n += 2 })
      ws._handleInfoEvent({ code: 42 })

      t.is(n, 3)
      wss.close()
    })

    await t.test('_handleInfoEvent: passes message to relevant named listeners', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      let n = 0

      ws.onServerRestart(() => { n += 1 })
      ws.onMaintenanceStart(() => { n += 10 })
      ws.onMaintenanceEnd(() => { n += 100 })

      ws._handleInfoEvent({ code: WSv2.info.SERVER_RESTART })
      ws._handleInfoEvent({ code: WSv2.info.MAINTENANCE_START })
      ws._handleInfoEvent({ code: WSv2.info.MAINTENANCE_END })

      t.is(n, 111)
      wss.close()
    })

    await t.test('_handleInfoEvent: closes & emits error if not on api v2', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()

      return new Promise((resolve) => {
        let seen = 0

        ws.on('error', () => { if (++seen === 2) { resolve() } })
        ws.on('close', () => { if (++seen === 2) { resolve() } })

        ws._handleInfoEvent({ version: 3 })
      })
    })

    await t.test('_flushOrderOps: returned promise rejects if not authorised', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._orderOpBuffer = [[0, 'oc', null, []]]

      try {
        await ws._flushOrderOps()
        t.ok(false)
      } catch (e) {
        t.ok(true, 'rejected due to being unauthorized')
      }
    })

    await t.test('_flushOrderOps: merges the buffer into a multi-op packet & sends', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true

      ws._orderOpBuffer = [
        [0, 'oc', null, []],
        [0, 'on', null, []],
        [0, 'oc_multi', null, []],
        [0, 'ou', null, []]
      ]

      ws.send = (packet) => {
        t.is(packet[1], 'ox_multi')
        t.is(packet[3].length, 4)
      }

      ws._flushOrderOps().catch(() => t.ok(false))
    })

    await t.test('_flushOrderOps: splits up buffers greater than 15 ops in size', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true

      let seenCount = 0
      let seenAll = false

      for (let i = 0; i < 45; i++) {
        ws._orderOpBuffer.push([0, 'oc', null, []])
      }

      ws.send = (packet) => {
        t.is(packet[1], 'ox_multi')
        t.ok(packet[3].length <= 15)
        seenCount += packet[3].length

        if (seenCount === 45) {
          seenAll = true
        }
      }

      await ws._flushOrderOps()
      t.ok(seenAll)
    })
  })

  await t.test('WSv2 packet watch-dog', async (t) => {
    await t.test('resets the WD timeout on every websocket message', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = new WSv2({ packetWDDelay: 1000 })
      t.is(ws._packetWDTimeout, null)

      ws.on('error', () => { }) // ignore json errors

      let wdResets = 0
      ws._resetPacketWD = () => {
        if (++wdResets === 4) t.pass()
      }

      ws._onWSMessage('asdf')
      ws._onWSMessage('asdf')
      ws._onWSMessage('asdf')
      ws._onWSMessage('asdf')
    })

    await t.test('_resetPacketWD: clears existing wd timeout', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = new WSv2({ packetWDDelay: 1000 })
      ws._packetWDTimeout = setTimeout(() => {
        t.ok(false)
      }, 100)

      ws._resetPacketWD()
      setTimeout(() => t.pass(), 200)
    })

    await t.test('_resetPacketWD: schedules new wd timeout', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = new WSv2({ packetWDDelay: 500 })
      ws._isOpen = true
      ws._triggerPacketWD = async () => { t.pass() }
      ws._resetPacketWD()
      t.ok(ws._packetWDTimeout !== null)
    })

    await t.test('_triggerPacketWD: does nothing if wd is disabled', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._isOpen = true
      ws.reconnect = async () => { t.ok(false) }
      ws._triggerPacketWD()

      setTimeout(() => t.pass(), 50)
    })

    await t.test('_triggerPacketWD: calls reconnect()', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = new WSv2({ packetWDDelay: 1000 })
      ws._isOpen = true
      ws.reconnect = async () => { t.pass() }
      ws._triggerPacketWD()
    })

    await t.test('triggers wd when no packet arrives after delay elapses', async (t) => {
      t.teardown(teardown)
      const now = Date.now()
      let wdTriggered = false

      ws = new WSv2({ packetWDDelay: 100 })
      ws._isOpen = true

      ws.on('error', () => { }) // invalid json to prevent message routing
      ws._triggerPacketWD = () => {
        t.ok((Date.now() - now) >= 95)
        wdTriggered = true

        return Promise.resolve()
      }

      ws._triggerPacketWD = ws._triggerPacketWD.bind(ws)
      ws._onWSMessage('asdf') // send first packet, init wd

      await new Promise(resolve => setTimeout(resolve, 150))

      t.ok(wdTriggered)
    })

    await t.test('doesn\'t trigger wd when packets arrive as expected', async (t) => {
      t.teardown(teardown)
      ws = new WSv2({ packetWDDelay: 100 })
      ws._isOpen = true

      ws.on('error', () => { }) // invalid json to prevent message routing

      const sendInterval = setInterval(() => {
        ws._onWSMessage('asdf')
      }, 50)

      ws._triggerPacketWD = async () => { t.ok(false) }
      ws._onWSMessage('asdf')

      await new Promise(resolve => setTimeout(resolve, 200))

      clearInterval(sendInterval)
      clearTimeout(ws._packetWDTimeout)
    })
  })

  await t.test('message sending', async (t) => {
    await t.test('emits error if no client available or open', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      return new Promise((resolve) => {
        ws.on('error', (e) => {
          if (!_includes(e.message, 'no ws client')) {
            throw new Error('received unexpected error')
          } else {
            resolve()
          }
        })

        ws.send({})
      })
    })

    await t.test('emits error if connection is closing', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      ws._ws = true
      ws._isOpen = true
      ws._isClosing = true

      return new Promise((resolve) => {
        ws.on('error', (e) => {
          if (!_includes(e.message, 'currently closing')) {
            throw new Error('received unexpected error')
          } else {
            resolve()
          }
        })

        ws.send({})
      })
    })

    await t.test('sends stringified payload', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      ws._isOpen = true
      ws._isClosing = false

      return new Promise((resolve) => {
        ws._ws = {
          send: (json) => {
            const msg = JSON.parse(json)

            t.is(msg.a, 42)
            resolve()
          }
        }

        ws.send({ a: 42 })
      })
    })
  })

  await t.test('WSv2 seq audit: _validateMessageSeq', async (t) => {
    await t.test('returns an error on invalid pub seq', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      ws._seqAudit = true
      ws._lastPubSeq = 0

      t.is(ws._validateMessageSeq([243, [252.12, 2, -1], 1]), null)
      t.is(ws._validateMessageSeq([243, [252.12, 2, -1], 2]), null)
      t.ok(_isError(ws._validateMessageSeq([243, [252.12, 2, -1], 5])))
    })

    await t.test('returns an error on invalid auth seq', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      ws._seqAudit = true
      ws._lastPubSeq = 0
      ws._lastAuthSeq = 0

      t.is(ws._validateMessageSeq([0, [252.12, 2, -1], 1, 1]), null)
      t.is(ws._validateMessageSeq([0, [252.12, 2, -1], 2, 2]), null)
      t.ok(_isError(ws._validateMessageSeq([0, [252.12, 2, -1], 3, 5])))
    })

    await t.test('ignores heartbeats', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      ws._seqAudit = true
      ws._lastPubSeq = 0

      t.is(ws._validateMessageSeq([243, [252.12, 2, -1], 1]), null)
      t.is(ws._validateMessageSeq([243, [252.12, 2, -1], 2]), null)
      t.is(ws._validateMessageSeq([243, 'hb']), null)
      t.is(ws._validateMessageSeq([243, 'hb']), null)
      t.is(ws._validateMessageSeq([243, [252.12, 2, -1], 3]), null)
      t.is(ws._validateMessageSeq([243, [252.12, 2, -1], 4]), null)
    })
  })

  await t.test('_handleTradeMessage', async (t) => {
    await t.test('correctly forwards payloads w/ seq numbers', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      const payload = [
        [286614318, 1535531325604, 0.05, 7073.51178714],
        [286614249, 1535531321436, 0.0215938, 7073.6],
        [286614248, 1535531321430, 0.0284062, 7073.51178714]
      ]

      const msg = [1710, payload, 1]
      let sawTrade = false

      ws.onTrades({ pair: 'tBTCUSD' }, (data) => {
        t.alike(data, payload)
        sawTrade = true
      })

      ws._handleTradeMessage(msg, {
        channel: 'trades',
        pair: 'tBTCUSD'
      })

      t.ok(sawTrade)
    })

    await t.test('correctly forwards funding trades', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      const payload = [
        [286614318, 1535531325604, 0.05, 7073.51178714],
        [286614249, 1535531321436, 0.0215938, 7073.6],
        [286614248, 1535531321430, 0.0284062, 7073.51178714]
      ]

      const msg = [1710, payload, 1]
      let sawTrade = false

      ws.onTrades({ pair: 'fUSD' }, (data) => {
        t.alike(data, payload)
        sawTrade = true
      })

      ws._handleTradeMessage(msg, {
        channel: 'trades',
        pair: 'fUSD'
      })

      t.ok(sawTrade)
    })

    await t.test('correctly routes fte packets', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      const payload = [636854, 'fUSD', 1575282446000, 41238905, -1000, 0.002, 7, null]
      const msg = [0, 'fte', payload]
      let sawFTE = false

      ws.onFundingTradeEntry({ pair: 'tBTCUSD' }, (data) => {
        t.alike(data[0], payload)
        sawFTE = true
      })

      ws._handleTradeMessage(msg, {
        channel: 'fte',
        pair: 'tBTCUSD'
      })

      t.ok(sawFTE)
    })

    await t.test('correctly routes ftu packets', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      const payload = [636854, 'fUSD', 1575282446000, 41238905, -1000, 0.002, 7, null]
      const msg = [0, 'ftu', payload]
      let sawFTU = false

      ws.onFundingTradeUpdate({ pair: 'tBTCUSD' }, (data) => {
        t.alike(data[0], payload)
        sawFTU = true
      })

      ws._handleTradeMessage(msg, {
        channel: 'ftu',
        pair: 'tBTCUSD'
      })

      t.ok(sawFTU)
    })

    await t.test('uses funding trade model for funding symbols', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance({ transform: true })

      const payload = [636854, 'fUSD', 1575282446000, 41238905, -1000, 0.002, 7, null]
      const msg = [0, 'ftu', payload]

      ws.on('trades', (_, data) => {
        t.ok(data instanceof FundingTrade)
      })

      ws._handleTradeMessage(msg, {
        channel: 'ftu',
        pair: 'fUSD'
      })
    })

    await t.test('uses public trade model for trading symbols', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance({ transform: true })

      const payload = [636854, 'tBTCUSD', 1575282446000, 41238905, -1000, 0.002, 7, null]
      const msg = [0, 'tu', payload]

      ws.on('trades', (_, data) => {
        t.ok(data instanceof PublicTrade)
      })

      ws._handleTradeMessage(msg, {
        channel: 'tu',
        pair: 'tBTCUSD'
      })
    })
  })

  await t.test('resubscribePreviousChannels', async (t) => {
    await t.test('resubscribes to channels in prev channel map', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      let subTicker = false
      let subTrades = false
      let subBook = false
      let subCandles = false

      ws._prevChannelMap = {
        123: { channel: 'ticker', symbol: 'tBTCUSD' },
        456: { channel: 'trades', symbol: 'tBTCUSD' },
        789: { channel: 'candles', key: 'trade:1m:tBTCUSD' },
        42: { channel: 'book', symbol: 'tBTCUSD', prec: 'R0', len: '25' }
      }

      ws.subscribeTicker = (sym) => {
        t.is(sym, 'tBTCUSD')
        subTicker = true
      }

      ws.subscribeTrades = (sym) => {
        t.is(sym, 'tBTCUSD')
        subTrades = true
      }

      ws.subscribeCandles = (key) => {
        t.is(key, 'trade:1m:tBTCUSD')
        subCandles = true
      }

      ws.subscribeOrderBook = (sym, prec, len) => {
        t.is(sym, 'tBTCUSD')
        t.is(prec, 'R0')
        t.is(len, '25')
        subBook = true
      }

      ws.resubscribePreviousChannels()

      t.ok(subTicker)
      t.ok(subTrades)
      t.ok(subCandles)
      t.ok(subBook)
    })
  })

  await t.test('getURL', async (t) => {
    await t.test('returns the URL the instance was constructed with', (t) => {
      t.teardown(teardown)
      const ws = new WSv2({ url: 'test' })
      t.is(ws.getURL(), 'test', 'instance does not use provided URL')
    })
  })

  await t.test('auth args', async (t) => {
    await t.test('provides getAuthArgs to read args', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws.updateAuthArgs({ dms: 4 })
      t.is(ws.getAuthArgs().dms, 4)
    })

    await t.test('initializes auth args', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      const initAuthArgs = ws.getAuthArgs()

      t.ok(_isObject(initAuthArgs))
      t.alike(initAuthArgs, {
        apiKey: API_KEY,
        apiSecret: API_SECRET
      })
    })

    await t.test('updates auth args with setAuthArgs', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()
      let sendCalled = false

      await ws.open()

      ws.updateAuthArgs({ dms: 4 })
      t.is(ws.getAuthArgs().dms, 4)

      ws.send = (payload) => {
        t.is(payload.dms, 4)
        sendCalled = true
        ws.emit('auth')
      }

      ws.auth() // note promise ignored
      t.ok(sendCalled)
    })
  })

  await t.test('usesAgent', async (t) => {
    await t.test('returns true if an agent was passed to the constructor', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance({
        agent: new SocksProxyAgent('socks4://127.0.0.1:9998')
      })

      t.ok(ws.usesAgent(), 'usesAgent() does not indicate agent presence when one was provided')
    })

    await t.test('returns false if no agent was passed to the constructor', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()

      t.ok(!ws.usesAgent(), 'usesAgent() indicates agent presence when none provided')
    })
  })

  await t.test('default connection url', async (t) => {
    await t.test('is a static member on the class', (t) => {
      t.teardown(teardown)
      t.ok(_isString(WSv2.url) && !_isEmpty(WSv2.url))
    })
  })

  await t.test('onMaintenanceStart', async (t) => {
    await t.test('is called when receiving a 20060 info code', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()

      await ws.open()

      return new Promise((resolve) => {
        ws.onMaintenanceStart(() => resolve())
        wss.send({
          event: 'info',
          code: '20060'
        })
      })
    })
  })

  await t.test('onMaintenanceEnd', async (t) => {
    await t.test('is called when receiving a 20061 info code', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()

      await ws.open()

      return new Promise((resolve) => {
        ws.onMaintenanceEnd(() => resolve())
        wss.send({
          event: 'info',
          code: '20061'
        })
      })
    })
  })

  await t.test('onServerRestart', async (t) => {
    await t.test('is called when receiving a 20051 info code', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()

      await ws.open()

      return new Promise((resolve) => {
        ws.onServerRestart(() => resolve())
        wss.send({
          event: 'info',
          code: '20051'
        })
      })
    })
  })

  await t.test('cancelOrder', async (t) => {
    await t.test('throws an error if not authenticated', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.cancelOrder().catch(() => { t.pass() })
    })

    await t.test('uses order as id if given number', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true
      ws._sendOrderPacket = (packet) => {
        t.alike(packet[3], { id: 42 })
      }

      ws.cancelOrder(42)
    })

    await t.test('parses id from order array', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true
      ws._sendOrderPacket = (packet) => {
        t.alike(packet[3], { id: 42 })
      }

      ws.cancelOrder([42])
    })

    await t.test('parses id from order object', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true
      ws._sendOrderPacket = (packet) => {
        t.alike(packet[3], { id: 42 })
      }

      ws.cancelOrder({ id: 42 })
    })

    await t.test('resolves on confirmation', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true
      ws._sendOrderPacket = () => { }

      ws.cancelOrder(42)
        .then(() => t.pass())
        .catch((e) => t.fail(e))

      ws._eventCallbacks.q.get('order-cancel-42')[0]()
    })
  })

  await t.test('cancelOrders', async (t) => {
    await t.test('throws an error if not authenticated', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws.cancelOrders([]).catch(() => t.pass())
    })

    await t.test('calls cancelOrder with each order', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true

      let seen = 0

      ws.cancelOrder = (i) => { seen += i }
      ws.cancelOrders([1, 2])
      t.is(seen, 3)
    })

    await t.test('resolves when all orders are cancelled', async (t) => {
      t.teardown(teardown)
      const now = Date.now()
      ws = createTestWSv2Instance()
      ws._isAuthenticated = true
      ws.cancelOrder = async () => {
        return new Promise(resolve => setTimeout(resolve, 10))
      }

      await ws.cancelOrders([1, 2])

      t.ok(Date.now() - now >= 10, 'did not wait') // note 10 - parallel
    })
  })

  await t.test('_handleTickerMessage', async (t) => {
    await t.test('forwards messages to relevant listeners', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance()
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'ticker',
          symbol: 'tBTCUSD'
        }
      }

      ws.onTicker({ symbol: 'tBTCUSD' }, () => { t.pass() })
      ws._handleTickerMessage([42, ['test']], ws._channelMap[42])
    })

    await t.test('emits a ticker event with the symbol', (t) => {
      t.teardown(teardown)
      t.plan(2)
      ws = createTestWSv2Instance()
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'ticker',
          symbol: 'tBTCUSD'
        }
      }

      ws.on('ticker', (symbol, data) => {
        t.is(symbol, 'tBTCUSD')
        t.is(data[0], 42)
      })

      ws._handleTickerMessage([42, [42]], ws._channelMap[42])
    })

    await t.test('uses the trading ticker model for trade symbols', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance({ transform: true })
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'ticker',
          symbol: 'tBTCUSD'
        }
      }

      ws.on('ticker', (symbol, data) => {
        t.ok(data instanceof TradingTicker)
      })

      ws._handleTickerMessage([42, [42]], ws._channelMap[42])
    })

    await t.test('uses the funding ticker model for funding symbols', (t) => {
      t.teardown(teardown)
      t.plan(1)
      ws = createTestWSv2Instance({ transform: true })
      ws._channelMap = {
        42: {
          chanId: 42,
          channel: 'ticker',
          symbol: 'fUSD'
        }
      }

      ws.on('ticker', (symbol, data) => {
        t.ok(data instanceof FundingTicker)
      })

      ws._handleTickerMessage([42, [42]], ws._channelMap[42])
    })
  })

  await t.test('getChannelId', async (t) => {
    await t.test('matches the specified type and filter', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._channelMap = {
        test: {
          chanId: 42,
          channel: 'ticker',
          symbol: 'fUSD'
        }
      }

      t.is(ws.getDataChannelId('ticker', { symbol: 'fUSD' }), 'test')
    })
  })
})

test.skip('WSv2 unit', async (t) => {
  await t.test('WSv2 seq audit: _validateMessageSeq', async (t) => {
    await t.test('all chan 0 messages except for notifications include, but do not advance the pub seq num', (t) => {
      const ws = new WSv2()

      ws._seqAudit = true
      ws._lastPubSeq = 1
      ws._lastAuthSeq = 1

      t.is(ws._validateMessageSeq([0, 'bu', [], 1, 2]), null)
      t.is(ws._validateMessageSeq([0, 'bu', [], 1, 3]), null)
      t.is(ws._validateMessageSeq([0, 'bu', [], 1, 4]), null)
      t.is(ws._validateMessageSeq([0, 'n', [], 1, 5]), null)
      t.is(ws._lastPubSeq, 1)
      t.is(ws._lastAuthSeq, 5)
    })

    await t.test('non-*-req notifications advance the auth seq num and do not include a pub seq num', (t) => {
      const ws = new WSv2()

      ws._seqAudit = true
      ws._lastPubSeq = 4
      ws._lastAuthSeq = 4

      const nonReqPayload = [null, null, null, null, null, null, null]

      t.is(ws._validateMessageSeq([0, 'n', nonReqPayload, 5]), null)
      t.is(ws._validateMessageSeq([0, 'n', nonReqPayload, 6]), null)
      t.is(ws._validateMessageSeq([0, 'n', nonReqPayload, 7]), null)
      t.is(ws._validateMessageSeq([0, 'n', nonReqPayload, 8]), null)
      t.is(ws._validateMessageSeq([0, 'n', nonReqPayload, 9]), null)
      t.is(ws._lastPubSeq, 9)
      t.is(ws._lastAuthSeq, 9)
    })

    await t.test('*-req notifications do not advance the auth sequence number', (t) => {
      const ws = new WSv2()
      const onReqPacket = [0, 'n', [0, 'on-req', null, null, [], null, '', ''], 1]
      const ouReqPacket = [0, 'n', [0, 'ou-req', null, null, [], null, '', ''], 1]
      const ocReqPacket = [0, 'n', [0, 'oc-req', null, null, [], null, '', ''], 1]

      ws._seqAudit = true
      ws._lastPubSeq = -1
      ws._lastAuthSeq = -1

      t.is(ws._validateMessageSeq(onReqPacket), null)
      t.is(ws._validateMessageSeq(ouReqPacket), null)
      t.is(ws._validateMessageSeq(ocReqPacket), null)
      t.is(ws._lastPubSeq, -1)
      t.is(ws._lastAuthSeq, 3)
    })
  })
})
