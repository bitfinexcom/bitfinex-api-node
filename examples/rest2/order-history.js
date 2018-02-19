'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const args = process.argv
const debug = require('debug')('bfx:examples:rest2-order-history')

if (args.length < 3) {
  debug('error: symbol required (i.e: npm run order-history ETHUSD')
  process.exit(1)
}

const Table = require('../../lib/util/cli_table')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const pair = String(args[2])
const symbol = pair[0] === 't' ? pair : `t${pair}`

// TODO: natural lang start/end query args (a library must exist)
const START = Date.now() - (30 * 24 * 60 * 60 * 1000 * 1000)
const END = Date.now()
const LIMIT = 25

const table = Table({
  'Order ID': 12,
  Created: 20,
  Updated: 20,
  Amount: 14,
  Filled: 14,
  Price: 14,
  Status: 40
})

debug('fetching 30d order history for %s...', symbol)

rest.orderHistory(symbol, START, END, LIMIT).then(orders => {
  let o

  for (let i = 0; i < orders.length; i += 1) {
    o = orders[i]
    o.status = `${o.status[0].toUpperCase()}${o.status.substring(1)}`
    o.mtsCreate = new Date(o.mtsCreate).toLocaleString()
    o.mtsUpdate = new Date(o.mtsUpdate).toLocaleString()

    table.push([
      o.id, o.mtsCreate, o.mtsUpdate, o.amountOrig, o.amountOrig - o.amount,
      o.price, o.status.split(' was:')[0]
    ])
  }

  console.log(table.toString())
}).catch(console.error)
