'use strict'

const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')
const runExample = require('../util/run_example')
const argFromCLI = require('../util/arg_from_cli')

const START = Date.now() - (30 * 24 * 60 * 60 * 1000 * 1000)
const END = Date.now()
const LIMIT = 25

module.exports = runExample({
  name: 'rest-get-trade-history',
  rest: { env: true, transform: true },
  params: {
    symbol: argFromCLI(0, null)
  }
}, async ({ debug, debugTable, rest, params }) => {
  let { symbol } = params

  if (!_isString(symbol) || _isEmpty(symbol)) {
    return debug('symbol required')
  }

  if (symbol[0] !== 't') {
    symbol = `t${symbol}`
  }

  debug('fetching 30d trade history for %s...', symbol)

  const trades = await rest.accountTrades(symbol, START, END, LIMIT)

  if (trades.length === 0) {
    return debug('no historical trades for %s', symbol)
  }

  debugTable({
    headers: [
      'Trade ID', 'Order ID', 'Created', 'Exec Amount', 'Exec Price', 'Fee'
    ],

    rows: trades.map(t => [
      t.id, t.orderID, new Date(t.mtsCreate).toLocaleString(),
      prepareAmount(t.execAmount), preparePrice(t.execPrice),
      `${t.fee} ${t.feeCurrency}`
    ])
  })
})
