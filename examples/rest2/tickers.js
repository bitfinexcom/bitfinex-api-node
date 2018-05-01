'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_tickers')
const Table = require('cli-table2')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const table = new Table({
  colWidths: [10, 14, 14, 14, 14, 14, 14, 18, 18],
  head: [
    'Symbol', 'Last', 'High', 'Low', 'Daily Change', 'Bid', 'Ask', 'Bid Size',
    'Ask Size'
  ]
})

debug('fetching symbol list...')

rest.symbols().then(symbols => {
  debug('available symbols are: %s', symbols.join(', '))
  debug('fetching tickers...')

  return rest.tickers([symbols.map(s => `t${s.toUpperCase()}`)])
}).then(tickers => {
  let t
  for (let i = 0; i < tickers.length; i += 1) {
    t = tickers[i]
    table.push([
      t.symbol, t.lastPrice, t.high, t.low, t.dailyChange, t.bid, t.ask,
      t.bidSize, t.askSize
    ])
  }

  console.log(table.toString())
}).catch(debug)
