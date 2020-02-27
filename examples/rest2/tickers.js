'use strict'

const { preparePrice, prepareAmount } = require('bfx-api-node-util')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-tickers',
  rest: { transform: true }
}, async ({ rest, debug, debugTable }) => {
  debug('fetching symbol list...')

  const symbols = await rest.symbols()

  debug('read %d symbols', symbols.length)
  debug('fetching tickers...')

  const tickers = await rest.tickers([symbols.map(s => `t${s.toUpperCase()}`)])

  debugTable({
    colWidths: [10, 14, 14, 14, 14, 14, 14, 18, 18],
    headers: [
      'Symbol', 'Last', 'High', 'Low', 'Daily Change', 'Bid', 'Ask', 'Bid Size',
      'Ask Size'
    ],

    rows: tickers.map(t => ([
      t.symbol, preparePrice(t.lastPrice), preparePrice(t.high),
      preparePrice(t.low), (t.dailyChange * 100).toFixed(2), preparePrice(t.bid),
      preparePrice(t.ask), prepareAmount(t.bidSize), prepareAmount(t.askSize)
    ]))
  })
})
