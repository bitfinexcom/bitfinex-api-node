'use strict'

process.env.DEBUG = 'bfx:examples:*'

const PI = require('p-iteration')
const debug = require('debug')('bfx:examples:close_position')
const { Order } = require('bfx-api-node-models')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const ws = bfx.ws(2)

const example = async () => {
  const positions = await rest.positions()

  if (positions.length === 0) {
    return debug('no open positions')
  }

  const orders = positions.map(({ symbol, amount }) => new Order({
    symbol,
    type: 'MARKET',
    amount: amount * -1,
    flags: Order.flags.REDUCE_ONLY | Order.flags.POS_CLOSE,
  }))

  orders.forEach(o => (
    debug('submitting: %s', JSON.stringify(o.toNewOrderPacket()))
  ))

  ws.on('open', () => {
    debug('authenticating...')
    ws.auth()
  })

  ws.on('auth', () => {
    debug('auth')

    PI.forEachSeries(orders, async o => {
      return ws.submitOrder(o)
    }).then(() => {
      debug('closed positions')
      return rest.positions()
    }).then(newPositions => {
      debug('RESTv2 positions: %s', JSON.stringify(newPositions))
    })
  })

  debug('connecting ws2...')
  ws.open()
}

example().catch(debug)
