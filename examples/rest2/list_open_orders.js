'use strict'

const _capitalize = require('lodash/capitalize')
const _isEmpty = require('lodash/isEmpty')
const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-list-open-orders',
  rest: { env: true, transform: true },
  params: {
    filterByMarket: null
  }
}, async ({ rest, debug, debugTable, params }) => {
  const { filterByMarket } = params

  debug('fetching open orders...')
  const allOrders = await rest.activeOrders()

  if (allOrders.length === 0) {
    return debug('no open orders matching filters')
  }

  const orders = _isEmpty(filterByMarket)
    ? allOrders
    : allOrders.filter(o => o.symbol === filterByMarket)

  debug('read %d open order(s)', orders.length)

  debugTable({
    headers: [
      'Symbol', 'Type', 'Amount', 'Price', 'Status', 'ID', 'CID',
      'Created', 'Updated'
    ],

    rows: orders.map((o) => [
      o.symbol, o.type, prepareAmount(o.amount), preparePrice(o.price),
      _capitalize(o.status.split(':')[0]), o.id, o.cid,
      new Date(o.mtsCreate).toLocaleString(),
      new Date(o.mtsUpdate).toLocaleString()
    ])
  })
})
