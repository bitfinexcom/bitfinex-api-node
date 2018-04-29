'use strict'

process.env.DEBUG = 'bfx:examples:*'

const args = process.argv
const debug = require('debug')('bfx:examples:rest2-trade-history')

if (args.length < 3) {
  debug('error: symbol required (i.e: npm run trade-history ETHUSD')
  process.exit(1)
}

const Table = require('cli-table2')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const pair = String(args[2])
const symbol = pair[0] === 't' ? pair : `t${pair}`

// TODO: natural lang start/end query args (a library must exist)
const START = Date.now() - (30 * 24 * 60 * 60 * 1000 * 1000)
const END = Date.now()
const LIMIT = 25

const table = new Table({
  colWidths: [12, 13, 20, 20, 14, 14, 14, 20],
  head: [
    'Trade ID', 'Order ID', 'Created', 'Type', 'Exec Amount', 'Exec Price',
    'Price', 'Fee'
  ]
})

debug('fetching 30d trade history for %s...', symbol)

rest.accountTrades(symbol, START, END, LIMIT).then(trades => {
  let t

  for (let j = 0; j < trades.length; j += 1) {
    t = trades[j]
    t.mtsCreate = new Date(t.mtsCreate).toLocaleString()

    table.push([
      t.id, t.orderID, t.mtsCreate, t.orderType, t.execAmount, t.execPrice,
      t.orderPrice, `${t.fee} ${t.feeCurrency}`
    ])
  }

  console.log(table.toString())
}).catch(err => {
  debug('error: %j', err)
})
