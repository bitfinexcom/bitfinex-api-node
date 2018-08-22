'use strict'

process.env.DEBUG = 'bfx:api:*'

const debug = require('debug')('bfx:api:examples:ws2:tickers')
const bfx = require('../legacy_bfx.js')
const ws = bfx.ws(2, { transform: true })

ws.on('open', () => {
  debug('open')
  ws.subscribeTicker('tETHUSD')
  ws.subscribeTicker('fUSD')
})

ws.onTicker({ symbol: 'tETHUSD' }, (ticker) => {
  debug('ETH/USD ticker: %j', ticker.toJS())
})

ws.onTicker({ symbol: 'fUSD' }, (ticker) => {
  debug('fUSD ticker: %j', ticker.toJS())
})

ws.open()
