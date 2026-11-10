'use strict'

const test = require('brittle')
const WSv2 = require('../../../lib/transports/ws2')
const { Order } = require('bfx-api-node-models')
const { MockWSv2Server } = require('bfx-api-mock-srv')

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

test('WSv2 integration', async (t) => {
  let ws = null
  let wss = null

  const teardown = async () => {
    try { // may fail due to being modified by a test, it's not a problem
      if (ws && ws.isOpen()) {
        await ws.close()
      }
    } catch (e) {
      t.ok(true)
    }

    if (wss && wss.isOpen()) {
      await wss.close()
    }

    ws = null
    wss = null
  }

  await t.test('orders', async (t) => {
    await t.test('creates & confirms orders', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server({ listen: true })
      ws = createTestWSv2Instance()

      await ws.open()
      await ws.auth()

      const o = new Order({
        gid: null,
        cid: 0,
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      })

      return ws.submitOrder(o)
    })

    await t.test('keeps orders up to date', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server({ listen: true })
      ws = createTestWSv2Instance()

      await ws.open()
      await ws.auth()

      const o = new Order({
        gid: null,
        cid: 0,
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      }, ws)

      o.registerListeners()

      await o.submit()

      const arr = o.serialize()
      arr[16] = 256

      wss.send([0, 'ou', arr])

      await new Promise(resolve => setTimeout(resolve, 100))

      t.is(o.price, 256)
      arr[16] = 150

      wss.send([0, 'oc', arr])

      await new Promise(resolve => setTimeout(resolve, 100))

      t.is(o.price, 150)
      o.removeListeners()
    })

    await t.test('updateOrder: sends order changeset packet through', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()
      await ws.auth()

      let sawMessage = false
      const o = new Order({
        id: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      }, ws)

      ws._ws.send = (msgJSON) => {
        const msg = JSON.parse(msgJSON)

        t.is(msg[0], 0)
        t.is(msg[1], 'ou')
        t.ok(msg[3])
        t.is(msg[3].id, o.id)
        t.is(+msg[3].delta, 1)
        t.is(+msg[3].price, 200)

        sawMessage = true
      }

      o.update({ price: 200, delta: 1 }) // note promise ignored
      t.ok(sawMessage)
    })

    await t.test('sends individual order packets when not buffering', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance()

      await ws.open()
      await ws.auth()

      let sawBothOrders = false
      const oA = new Order({
        gid: null,
        cid: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      })

      const oB = new Order({
        gid: null,
        cid: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 10,
        amount: 1,
        symbol: 'tETHUSD'
      })

      let sendN = 0

      ws._ws.send = (msgJSON) => {
        const msg = JSON.parse(msgJSON)
        t.is(msg[1], 'on')
        sendN++

        if (sendN === 2) {
          sawBothOrders = true
        }
      }

      // note promises ignored
      ws.submitOrder(oA)
      ws.submitOrder(oB)

      t.ok(sawBothOrders)
    })

    await t.test('buffers order packets', async (t) => {
      t.teardown(teardown)
      wss = new MockWSv2Server()
      ws = createTestWSv2Instance({
        orderOpBufferDelay: 100
      })

      await ws.open()
      await ws.auth()

      const oA = new Order({
        gid: null,
        cid: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      })

      const oB = new Order({
        gid: null,
        cid: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 10,
        amount: 1,
        symbol: 'tETHUSD'
      })

      return new Promise((resolve) => {
        ws._ws.send = (msgJSON) => {
          const msg = JSON.parse(msgJSON)
          t.is(msg[1], 'ox_multi')

          msg[3].forEach((payload) => {
            t.is(payload[0], 'on')
          })

          wss.close()
          resolve()
        }

        // note promises ignored
        ws.submitOrder(oA)
        ws.submitOrder(oB)
      })
    })
  })

  await t.test('listeners', async (t) => {
    await t.test('manages listeners by cbGID', (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      ws._channelMap = { 0: { channel: 'auth' } }

      let updatesSeen = 0
      ws.onAccountTradeUpdate({ pair: 'BTCUSD', cbGID: 10 }, () => updatesSeen++)
      ws.onOrderUpdate({ symbol: 'tBTCUSD', cbGID: 10 }, () => updatesSeen++)

      ws._handleChannelMessage([0, 'tu', [123, 'tBTCUSD']])
      ws._handleChannelMessage([0, 'ou', [0, 0, 0, 'tBTCUSD']])
      ws.removeListeners(10)
      ws._handleChannelMessage([0, 'tu', [123, 'tBTCUSD']])
      ws._handleChannelMessage([0, 'ou', [0, 0, 0, 'tBTCUSD']])

      t.is(updatesSeen, 2)
    })

    await t.test('tracks channel refs to auto sub/unsub', async (t) => {
      t.teardown(teardown)
      ws = createTestWSv2Instance()
      wss = new MockWSv2Server()
      let subs = 0
      let unsubs = 0

      await ws.open()

      wss.on('message', (ws, msg) => {
        if (msg.event === 'subscribe' && msg.channel === 'trades') {
          subs++
          ws.send(JSON.stringify({
            event: 'subscribed',
            chanId: 42,
            channel: 'trades',
            symbol: msg.symbol
          }))
        } else if (msg.event === 'unsubscribe' && msg.chanId === 42) {
          unsubs++
          ws.send(JSON.stringify({
            event: 'unsubscribed',
            chanId: 42
          }))
        }
      })

      ws.subscribeTrades('tBTCUSD')
      ws.subscribeTrades('tBTCUSD')
      ws.subscribeTrades('tBTCUSD')

      ws.on('subscribed', () => {
        ws.unsubscribeTrades('tBTCUSD')
        ws.unsubscribeTrades('tBTCUSD')
        ws.unsubscribeTrades('tBTCUSD')
        ws.unsubscribeTrades('tBTCUSD')
        ws.unsubscribeTrades('tBTCUSD')
      })

      return new Promise((resolve) => {
        ws.on('unsubscribed', () => {
          t.is(subs, 1)
          t.is(unsubs, 1)
          resolve()
        })
      })
    })
  })

  await t.test('info message handling', async (t) => {
    await t.test('notifies listeners on matching code', (t) => {
      t.teardown(teardown)
      let sawMaintenanceEnd = false
      ws = new WSv2()

      ws.onInfoMessage(WSv2.info.MAINTENANCE_END, () => {
        sawMaintenanceEnd = true
      })

      ws._onWSMessage(JSON.stringify({
        event: 'info',
        code: WSv2.info.MAINTENANCE_START,
        msg: ''
      }))

      ws._onWSMessage(JSON.stringify({
        event: 'info',
        code: WSv2.info.MAINTENANCE_END,
        msg: ''
      }))

      t.ok(sawMaintenanceEnd)
    })
  })
})
