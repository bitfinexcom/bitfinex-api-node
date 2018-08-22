'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:api:examples:ws2:ox_multi')
const { Order } = require('bfx-api-node-models')
const bfx = require('../legacy_bfx.js')
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

  const oC = new Order({
    symbol: 'tETHBTC',
    price: 1,
    amount: 1,
    type: 'EXCHANGE LIMIT'
  }, ws)

  oA.submit().then(() => {
    debug('created order A')
    return oB.submit()
  }).then(() => {
    debug('created order B')
    return oC.submit()
  }).then(() => {
    debug('created order C')

    ws.send([0, 'ox_multi', null, [
      ['oc', { id: oA.id }],
      ['oc_multi', { id: [oB.id, oC.id] }]
    ]])

    debug('sent ox_multi to cancel order A and orders [B, C]')
  })
})

ws.open()
