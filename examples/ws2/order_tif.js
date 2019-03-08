'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_order_tif')
const { Order } = require('bfx-api-node-models')
const bfx = require('../bfx')
const ws = bfx.ws(2)

ws.on('error', (err) => {
  console.log(err)
})

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.once('auth', () => {
  debug('authenticated')

  // Build new order
  const o = new Order({
    cid: Date.now(),
    symbol: 'tBTCUSD',
    price: 17833.5,
    amount: -0.02,
    type: Order.type.LIMIT,
    tif: '2019-03-08 15:00:00',
  }, ws)

  let closed = false

  o.registerListeners()

  o.on('update', () => {
    debug('order updated: %j', o.serialize())
  })

  o.on('close', () => {
    debug('order closed: %s', o.status)
    closed = true
  })

  debug('submitting order %d', o.cid)

  o.submit().then(() => {
    debug(
      'got submit confirmation for order %d [%d] [tif: %d]',
      o.cid, o.id, o.mtsTIF
    )
  }).catch((err) => {
    console.log(err)
    ws.close()
  })
})

ws.open()
