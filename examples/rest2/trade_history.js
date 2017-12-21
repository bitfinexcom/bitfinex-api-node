'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_trade_history')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

debug('fetching trades...')

const start = Date.now() - (90 * 24 * 60 * 60 * 1000)
const end = Date.now()
const limit = 25

rest.trades('tETHUSD', start, end, limit, (err, trades) => {
  if (err) {
    return debug('error: %s', err.message)
  }

  trades.forEach((trade) => {
    debug(
      'trade ID %d %s | %f @ %f | %s',
      trade.id, trade.pair, trade.execAmount, trade.execPrice, trade.orderType
    )
  })
}).catch((err) => {
  debug('error: %j', err)
})
