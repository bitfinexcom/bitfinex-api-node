'use strict'

const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const _isEmpty = require('lodash/isEmpty')
const runExample = require('../util/run_example')

const START = Date.now() - (30 * 24 * 60 * 60 * 1000 * 1000)
const END = Date.now()
const LIMIT = 25

module.exports = runExample({
  name: 'rest-get-order-history',
  rest: { env: true, transform: true },
  params: {
    market: 'tBTCUSD'
  }
}, async ({ debug, debugTable, rest, params }) => {
  const { market } = params

  if (_isEmpty(market)) {
    return debug('market required')
  }

  debug('fetching 30d order history for %s...', market)

  const orders = await rest.orderHistory(market, START, END, LIMIT)

  if (orders.length === 0) {
    return debug('no historical orders for %s', market)
  }

  debugTable({
    headers: [
      'Order ID', 'Created', 'Updated', 'Amount', 'Filled', 'Price', 'Status'
    ],

    rows: orders.map(o => {
      o.status = `${o.status[0].toUpperCase()}${o.status.substring(1)}`
      o.mtsCreate = new Date(o.mtsCreate).toLocaleString()
      o.mtsUpdate = new Date(o.mtsUpdate).toLocaleString()

      return [
        o.id, o.mtsCreate, o.mtsUpdate, prepareAmount(o.amountOrig),
        prepareAmount(o.amountOrig - o.amount),
        preparePrice(o.price), o.status.split(':')[0]
      ]
    })
  })
})
