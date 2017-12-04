'use strict'

const WebSocket = require('ws')
const assert = require('assert')
const WSv2 = require('../../../lib/transports/ws2')
const { Order } = require('../../../lib/models')

const WSS_PORT = 1337
const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const spawnWSServer = () => {
  const wss = new WebSocket.Server({
    perMessageDeflate: false,
    port: WSS_PORT
  })

  const clients = []

  wss.send = (packet) => {
    clients.forEach(c => c.send(JSON.stringify(packet)))
  }

  wss.on('connection', (ws) => {
    clients.push(ws)

    ws.send(JSON.stringify({
      event: 'info',
      version: 2
    }))

    ws.on('message', (msgJSON) => {
      const msg = JSON.parse(msgJSON)

      if (msg.event === 'auth') {
        ws.send(JSON.stringify({
          event: 'auth',
          status: 'OK',
          chanId: 0,
          userId: 0,
        }))
      } else if (msg.constructor.name === 'Array') {
        if (msg[0] !== 0) return
        if (msg[1] !== 'on') return

        ws.send(JSON.stringify([0, 'n', [
          null,
          'on-req',
          null,
          null, [
            msg[3].gid,
            null,
            msg[3].cid,
            msg[3].symol,
            null,
            null,
            msg[3].amount,
            msg[3].amount,
            msg[3].type,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            msg[3].price,
            null,
            null,
            null,
            null,
            null,
            null,
            0,
            null,
            null
          ],
          null,
          'SUCCESS',
          'Submitting order'
        ]]))
      }
    })
  })

  return wss
}

const createTestWSv2Instance = (params = {}) => {
  return new WSv2(Object.assign({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: `ws://localhost:${WSS_PORT}`
  }, params))
}

describe('WSv2 orders', () => {
  const wss = spawnWSServer()

  it('creates & confirms orders', (done) => {
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

      ws.submitOrder(o).then(() => done()).catch(done)
    })
  })

  it('keeps orders up to date', (done) => {
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
            done()
          }, 50)
        }, 50)
      }).catch(done)
    })
  })

  it('sends individual order packets when not buffering', (done) => {
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

        if (sendN === 2) done()
      }

      wsSingle.submitOrder(oA)
      wsSingle.submitOrder(oB)
    })
  })

  it('buffers order packets', (done) => {
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

        done()
      }

      wsMulti.submitOrder(oA)
      wsMulti.submitOrder(oB)
    })
  })
})

describe('WSv2 listeners', () => {
  it('notifies filtered listeners')
  it('manages listeners by cbGID')
  it('tracks channel refs to auto sub/unsub')
})
