'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_trades')
const bfx = require('../bfx')

const ws = bfx.ws(2)

ws.on('open', () => {
  debug('open')
  ws.subscribeTrades('tEOSUSD')
  ws.auth()
})

ws.onTradeEntry({ pair: 'EOSUSD' }, (trade) => {
  debug('te: %j', trade)
})

ws.onTrades({ pair: 'EOSUSD' }, (trades) => {
  debug('trades: %j', trades)
})

ws.onAccountTradeEntry({ symbol: 'tEOSUSD' }, (trade) => {
  debug('account te: %j', trade)
})

ws.onAccountTradeUpdate({ symbol: 'tEOSUSD' }, (trade) => {
  debug('account tu: %j', trade)
})

ws.open()
