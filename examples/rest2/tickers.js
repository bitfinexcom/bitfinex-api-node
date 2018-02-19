'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const co = require('co')
const debug = require('debug')('bfx:examples:rest2_tickers')
const Table = require('../../lib/util/cli_table')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const table = Table({
  Symbol: 10,
  Last: 16,
  High: 14,
  Low: 14,
  'Daily %': 14,
  Bid: 14,
  Ask: 14,
  'Bid Size': 14,
  'Ask Size': 14
})

co.wrap(function * () {
  debug('fetching symbol list...')
  const tickerSymbols = yield rest.symbols()
  const symbols = tickerSymbols.map(s => `t${s.toUpperCase()}`)

  debug('fetching tickers...')
  const tickers = yield rest.tickers(symbols)

  let t
  for (let i = 0; i < tickers.length; i += 1) {
    t = tickers[i] // no rounding

    table.push([
      t.symbol, t.lastPrice, t.high, t.low, t.dailyChange, t.bid, t.ask,
      t.bidSize, t.askSize
    ])
  }

  console.log(table.toString())
})().catch(console.error)
