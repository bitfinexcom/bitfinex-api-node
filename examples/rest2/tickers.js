'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_trades')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

debug('fetching data...')

rest.tickers(['tBTCUSD', 'tETHUSD'], (err, data) => {
  if (err) {
    return debug('error: %j', err)
  }

  data.forEach((ticker) => {
    debug(
      'tick %s | bid %f | ask %f | daily change %f',
      ticker.symbol, ticker.bid, ticker.ask, ticker.dailyChange
    )
  })
}).catch((err) => {
  debug('error: %j', err)
})
