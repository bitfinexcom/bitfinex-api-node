'use strict'

const WebSocket = require('ws')
const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')
const { Order } = require('../../../lib/models')
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

describe('WSv2 orders', () => {
  it('creates & confirms orders', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance()
    ws.open()
    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      const o = new Order({
        gid: null,
        cid: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      })

      ws.submitOrder(o).then(() => {
        wss.close()
        done()
      }).catch(done)
    })
  })

  it('keeps orders up to date', (done) => {
    const wss = new MockWSServer()
    const ws = createTestWSv2Instance()
    ws.open()
    ws.on('open', ws.auth.bind(ws))
    ws.once('auth', () => {
      const o = new Order({
        gid: null,
        cid: Date.now(),
        type: 'EXCHANGE LIMIT',
        price: 100,
        amount: 1,
        symbol: 'tBTCUSD'
      }, ws)

      o.submit().then(() => {
        const arr = o.serialize()
        arr[16] = 256

        wss.send([0, 'ou', arr])

        setTimeout(() => {
          assert.equal(o.price, 256)
          arr[16] = 150

          wss.send([0, 'oc', arr])

          setTimeout(() => {
            assert.equal(o.price, 150)
            wss.close()
            done()
          }, 50)
        }, 50)
      }).catch(done)
    })
  })

  it('sends individual order packets when not buffering', (done) => {
    const wss = new MockWSServer()
    const wsSingle = createTestWSv2Instance()
    wsSingle.open()
    wsSingle.on('open', wsSingle.auth.bind(wsSingle))
    wsSingle.once('auth', () => {
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

      wsSingle._ws.send = (msgJSON) => {
        const msg = JSON.parse(msgJSON)
        assert.equal(msg[1], 'on')
        sendN++

        if (sendN === 2) {
          wss.close()
          done()
        }
      }

      wsSingle.submitOrder(oA)
      wsSingle.submitOrder(oB)
    })
  })

  it('buffers order packets', (done) => {
    const wss = new MockWSServer()
    const wsMulti = createTestWSv2Instance({
      orderOpBufferDelay: 100,
    })

    wsMulti.open()
    wsMulti.on('open', wsMulti.auth.bind(wsMulti))
    wsMulti.once('auth', () => {
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

      wsMulti._ws.send = (msgJSON) => {
        const msg = JSON.parse(msgJSON)
        assert.equal(msg[1], 'ox_multi')

        msg[3].forEach((payload) => {
          assert.equal(payload[0], 'on')
        })

        wss.close()
        done()
      }

      wsMulti.submitOrder(oA)
      wsMulti.submitOrder(oB)
    })
  })
})

describe('WSv2 listeners', () => {
  it('manages listeners by cbGID', () => {
    const ws = createTestWSv2Instance()
    ws._channelMap = { 0: { channel: 'auth' }}

    let updatesSeen = 0
    ws.onTradeUpdate({ pair: 'tBTCUSD', cbGID: 10 }, () => updatesSeen++)
    ws.onOrderUpdate({ symbol: 'tBTCUSD', cbGID: 10 }, () => updatesSeen++)

    ws._handleChannelMessage([0, 'tu', [0, 'tBTCUSD']])
    ws._handleChannelMessage([0, 'ou', [0, 0, 0, 'tBTCUSD']])
    ws.removeListeners(10)
    ws._handleChannelMessage([0, 'tu', [0, 'tBTCUSD']])
    ws._handleChannelMessage([0, 'ou', [0, 0, 0, 'tBTCUSD']])

    assert.equal(updatesSeen, 2)
  })

  it('tracks channel refs to auto sub/unsub', (done) => {
    const ws = createTestWSv2Instance()
    const wss = new MockWSServer()
    let subs = 0
    let unsubs = 0

    wss.on('message', (ws, msg) => {
      if (msg.event === 'subscribe' && msg.channel === 'trades') {
        subs++
        ws.send(JSON.stringify({
          event: 'subscribed',
          chanId: 42,
          channel: 'trades',
          symbol: msg.symbol,
        }))
      } else if (msg.event === 'unsubscribe' && msg.chanId === 42) {
        unsubs++
        ws.send(JSON.stringify({
          event: 'unsubscribed',
          chanId: 42
        }))
      }
    })

    ws.on('open', () => {
      ws.subscribeTrades('tBTCUSD')
      ws.subscribeTrades('tBTCUSD')
      ws.subscribeTrades('tBTCUSD')
    })

    ws.on('subscribed', () => {
      ws.unsubscribeTrades('tBTCUSD')
      ws.unsubscribeTrades('tBTCUSD')
      ws.unsubscribeTrades('tBTCUSD')
      ws.unsubscribeTrades('tBTCUSD')
      ws.unsubscribeTrades('tBTCUSD')
    })

    ws.on('unsubscribed', () => {
      assert.equal(subs, 1)
      assert.equal(unsubs, 1)
      wss.close()
      done()
    })

    ws.open()
  })
})

describe('WSv2 info message handling', () => {
  it('notifies listeners on matching code', (done) => {
    const ws = new WSv2()

    ws.onInfoMessage(WSv2.info.MAINTENANCE_END, () => {
      done()
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
  })
})
