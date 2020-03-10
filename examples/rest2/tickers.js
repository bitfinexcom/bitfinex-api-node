'use strict'

const { preparePrice, prepareAmount } = require('bfx-api-node-util')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-tickers',
  rest: { transform: true },
  params: {
    filterByMarket: null
  }
}, async ({ rest, debug, debugTable, params }) => {
  const { filterByMarket } = params

  debug('fetching symbol list...')

  const rawSymbols = await rest.symbols()

  debug('read %d symbols', rawSymbols.length)

  const symbols = rawSymbols
    .map(s => `t${s.toUpperCase()}`)
    .filter(s => (
      !filterByMarket || (s === filterByMarket)
    ))

  if (symbols.length === 0) {
    return debug('no tickers match provided filters')
  }

  debug('fetching %d tickers...', symbols.length)

  const tickers = await rest.tickers(symbols)

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
