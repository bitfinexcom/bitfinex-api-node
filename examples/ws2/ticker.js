'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_tickers')
const bfx = require('../bfx')

const SYMBOL = 'tIOTEUR'
const ws = bfx.ws(2)

ws.on('open', () => {
  debug('open')
  ws.subscribeTicker(SYMBOL)
})

ws.onTicker({ symbol: SYMBOL }, (ticker) => {
  debug('%s ticker: %j', SYMBOL, ticker)
})

ws.open()
