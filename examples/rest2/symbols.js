'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_symbols')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = Table({
  Pair: 10,
  Precision: 13,
  'Initial Margin': 16,
  'Min Margin': 14,
  'Max O Size': 14,
  'Min O Size': 14,
  Expiration: 14
})

debug('fetching active symbol data...')

rest.symbolDetails().then(symbols => {
  let s

  for (let i = 0; i < symbols.length; i += 1) {
    s = symbols[i]
    s.pair = s.pair.toUpperCase()

    t.push([
      s.pair, s.price_precision, s.initial_margin, s.minimum_margin,
      s.maximum_order_size, s.minimum_order_size, s.expiration
    ])
  }

  console.log(t.toString())
}).catch(console.error)
