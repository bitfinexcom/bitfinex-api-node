'use strict'

const _isEmpty = require('lodash/isEmpty')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-trades',
  ws: {
    env: true,
    connect: true,
    keepOpen: true,
    transform: true
  },
  params: {
    market: 'tBTCUSD'
  }
}, async ({ ws, debug, params }) => {
  const { market } = params

  if (_isEmpty(market)) {
    throw new Error('market required')
  }

  if (market[0] === 't') {
    ws.onTradeEntry({ symbol: market }, (trade) => {
      debug('trade on %s: %s', market, trade.toString())
    })
  } else {
    ws.onFundingTradeEntry({ symbol: market }, (trade) => {
      debug('funding trade: %s', trade.toString())
    })
  }

  ws.onAccountTradeEntry({ symbol: market }, (trade) => {
    debug('account trade: %s', trade.toString())
  })

  await ws.subscribeTrades(market)
})
