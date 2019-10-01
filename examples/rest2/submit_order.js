'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:submit_order')
const bfx = require('../bfx')
const { Order } = require('bfx-api-node-models')
const rest = bfx.rest(2)

debug('Submitting new order...')

 // Build new order
 const o = new Order({
  cid: Date.now(),
  symbol: 'tBTCUSD',
  price: 18000,
  amount: -0.02,
  type: Order.type.LIMIT,
  lev: 10
}, rest)

o.submit().then(() => {
  debug(
    'got submit confirmation for order %d [%d] [tif: %d]',
    o.cid, o.id, o.mtsTIF
  )
})
.catch((err) => console.log(err))

// update order

setTimeout(() => {
  o.update({
    price: 17000
  })
}, 5000)

setTimeout(() => {
  o.cancel()
},10000)
