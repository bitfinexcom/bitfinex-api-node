'use strict'

const _capitalize = require('lodash/capitalize')
const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-list-open-orders',
  rest: { env: true, transform: true }
}, async ({ rest, debug, debugTable }) => {
  debug('fetching open orders...')
  const orders = await rest.activeOrders()

  if (orders.length === 0) {
    return debug('no open orders')
  }

  debug('received %d open orders', orders.length)

  debugTable({
    headers: [
      'Symbol', 'Type', 'Amount', 'Price', 'Status', 'ID', 'GID', 'CID',
      'Created', 'Updated'
    ],

    rows: orders.map((order) => {
      const o = { ...order.toJS() }

      o.status = _capitalize(o.status)
      o.mtsCreate = new Date(o.mtsCreate).toLocaleString()
      o.mtsUpdate = new Date(o.mtsUpdate).toLocaleString()

      return [
        o.symbol, o.type, prepareAmount(o.amount), preparePrice(o.price),
        o.status.split(':')[0], o.id, o.gid, o.cid, o.mtsCreate, o.mtsUpdate
      ]
    })
  })
})
