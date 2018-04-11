'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_trade_history')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

debug('fetching trades...')

const start = Date.now() - (90 * 24 * 60 * 60 * 1000)
const end = Date.now()
const limit = 100

rest.trades('tBTCUSD', start, end, limit, 1).then(trades => {
  trades.forEach((trade) => {
    debug(
      'trade %d | %s | %f @ %f',
      trade.id, new Date(trade.mts).toLocaleString(), trade.amount, trade.price
    )
  })
}).catch(err => {
  debug('error: %s', err.message)
})
