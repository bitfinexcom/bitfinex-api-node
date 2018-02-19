'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:examples:ws2_oc_multi')
const { Order } = require('../lib/models')
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

  const oA = new Order({
    symbol: 'tBTCUSD',
    price: 200,
    amount: 1,
    type: 'EXCHANGE LIMIT'
  }, ws)

  const oB = new Order({
    symbol: 'tETHUSD',
    price: 50,
    amount: 1,
    type: 'EXCHANGE LIMIT'
  }, ws)

  oA.submit().then(() => {
    debug('created order A')
    return oB.submit()
  }).then(() => {
    debug('created order B')

    ws.send([0, 'oc_multi', null, {
      id: [oA.id, oB.id]
    }])

    debug('sent oc_multi for orders A & B')
  })
})

ws.open()
