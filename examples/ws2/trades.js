'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_trades')
const bfx = require('../bfx')

const ws = bfx.ws(2)

ws.on('open', () => {
  debug('open')
  ws.subscribeTrades('tEOSUSD')
  ws.subscribeTrades('fUSD')
  ws.auth()
})

ws.onFundingTradeEntry({ symbol: 'fUSD' }, (trade) => {
  debug('fte: %j', trade)
})

ws.onFundingTradeUpdate({ symbol: 'fUSD' }, (trade) => {
  debug('ftu: %j', trade)
})

ws.onTradeEntry({ symbol: 'tEOSUSD' }, (trade) => {
  debug('te: %j', trade)
})

ws.onTrades({ symbol: 'tEOSUSD' }, (trades) => {
  debug('tEOSUSD trades: %j', trades)
})

ws.onTrades({ symbol: 'fUSD' }, (trades) => {
  debug('fUSD trades: %j', trades)
})

ws.onAccountTradeEntry({ symbol: 'tEOSUSD' }, (trade) => {
  debug('account te: %j', trade)
})

ws.onAccountTradeUpdate({ symbol: 'tEOSUSD' }, (trade) => {
  debug('account tu: %j', trade)
})

ws.open()
