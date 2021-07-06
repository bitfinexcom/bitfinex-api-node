'use strict'

const Promise = require('bluebird')
const { Order } = require('bfx-api-node-models')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

// Build new order
const o = new Order({
  cid: Date.now(),
  symbol: 'tBTCUSD',
  type: Order.type.EXCHANGE_LIMIT,
  amount: -0.05,

  oco: true,
  price: 2000,
  priceAuxLimit: 1000
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

  o.registerListeners(ws) // enable automatic updates

  let orderClosed = false

  o.on('update', () => {
    debug('updated: %s', o.toString())
  })

  o.on('close', () => {
    debug('order closed: %s', o.status)
    orderClosed = true
  })

  debug('submitting order %d', o.cid)
  await o.submit()
  debug('got submit confirmation for order %d [%d]', o.cid, o.id)

  // wait a bit...
  await Promise.delay(2 * 1000)

  if (orderClosed) {
    return debug('order closed prematurely; did it auto-fill?')
  }

  debug('canceling...')

  await o.cancel()
  debug('got cancel confirmation for order %d', o.cid)
  await ws.close()
}

execute()
