'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_cancel_all')
const bfx = require('../bfx')
const ws = bfx.ws(2, {})

ws.on('error', (err) => {
  console.log(err)
})

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.onOrderSnapshot({}, (snapshot) => {
  if (snapshot.length === 0) {
    debug('no orders to cancel')
    return
  }

  debug('canceling %d orders', snapshot.length)

  ws.cancelOrders(snapshot).then(() => {
    debug('cancelled all orders')
  })
})

ws.once('auth', () => {
  debug('authenticated')
})

ws.open()
