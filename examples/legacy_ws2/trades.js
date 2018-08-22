'use strict'

process.env.DEBUG = 'bfx:api:*'

const debug = require('debug')('bfx:api:examples:ws2:trades')
const bfx = require('../legacy_bfx.js')

const ws = bfx.ws(2)

ws.on('open', () => {
  debug('open')
  ws.subscribeTrades('tBTCUSD')
})

ws.onTradeEntry({ pair: 'BTCUSD' }, (trade) => {
  debug('te: %j', trade)
})

ws.onTradeUpdate({ pair: 'BTCUSD' }, (trade) => {
  debug('tu: %j', trade)
})

ws.onTrades({ pair: 'BTCUSD' }, (trades) => {
  debug('trades: %j', trades)
})

ws.open()
