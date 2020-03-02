'use strict'

const { Order } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

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

const oC = new Order({
  symbol: 'tETHBTC',
  price: 1,
  amount: 1,
  type: 'EXCHANGE LIMIT'
})

module.exports = runExample({
  name: 'ws2-ox-multi',
  ws: {
    env: true,
    connect: true,
    auth: true,
    transform: true,
    keepOpen: true
  }
}, async ({ ws, debug }) => {
  oA.registerListeners(ws)
  oB.registerListeners(ws)
  oC.registerListeners(ws)

  let oAClosed = false
  let oBClosed = false
  let oCClosed = false

  oA.on('close', async () => {
    debug('order A cancelled: %s', oA.status)

    oAClosed = true
    if (oBClosed && oCClosed) return ws.close()
  })

  oB.on('close', async () => {
    debug('order B cancelled: %s', oB.status)

    oBClosed = true
    if (oAClosed && oCClosed) return ws.close()
  })

  oC.on('close', async () => {
    debug('order C cancelled: %s', oC.status)

    oCClosed = true
    if (oAClosed && oBClosed) return ws.close()
  })

  await oA.submit()
  debug('created order A')

  await oB.submit()
  debug('created order B')

  await oC.submit()
  debug('created order C')

  ws.submitOrderMultiOp([
    ['oc', { id: oA.id }],
    ['oc_multi', { id: [oB.id, oC.id] }]
  ])

  debug('sent ox_multi to cancel order A and orders [B, C]')
})
