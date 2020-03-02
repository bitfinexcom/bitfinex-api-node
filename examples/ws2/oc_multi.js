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

module.exports = runExample({
  name: 'ws2-oc-multi',
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
})
