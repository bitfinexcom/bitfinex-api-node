'use strict'

const { Order } = require('bfx-api-node-models')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

const oA = new Order({
  symbol: 'tBTCUSD',
  price: 200,
  amount: 1,
  type: 'EXCHANGE LIMIT'
})

const oB = new Order({
  symbol: 'tETHUSD',
  price: 50,
  amount: 1,
  type: 'EXCHANGE LIMIT'
})

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    transform: true
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()
  await ws.auth()

  oA.registerListeners(ws)
  oB.registerListeners(ws)

  await oA.submit()
  debug('created order A')

  await oB.submit()
  debug('created order B')

  let oAClosed = false
  let oBClosed = false

  oA.on('close', async () => {
    debug('order A cancelled: %s', oA.status)

    oAClosed = true
    if (oBClosed) return ws.close()
  })

  oB.on('close', async () => {
    debug('order B cancelled: %s', oB.status)

    oBClosed = true
    if (oAClosed) return ws.close()
  })

  ws.send([0, 'oc_multi', null, {
    id: [oA.id, oB.id]
  }])

  debug('sent oc_multi for orders A & B')

  await ws.close()
}

execute()
