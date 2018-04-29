'use strict'

process.env.DEBUG = 'bfx:examples:*'

const Table = require('cli-table2')
const debug = require('debug')('bfx:examples:rest2_positions')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = new Table({
  colWidths: [14, 14, 14, 20, 20, 10, 20, 16, 16, 20],
  head: [
    'ID', 'GID', 'CID', 'Created', 'Updated', 'Symbol', 'Type', 'Amount',
    'Price', 'Status'
  ]
})

debug('fetching orders...')

rest.activeOrders().then(orders => {
  let o
  for (let i = 0; i < orders.length; i += 1) {
    o = orders[i]
    o.status = o.status.toLowerCase()
    o.status = `${o.status[0].toUpperCase()}${o.status.substring(1)}`
    o.mtsCreate = new Date(o.mtsCreate).toLocaleString()
    o.mtsUpdate = new Date(o.mtsUpdate).toLocaleString()

    t.push([
      o.id, o.gid, o.cid, o.mtsCreate, o.mtsUpdate, o.symbol, o.type, o.amount,
      o.price, o.status.split(':')[0]
    ])
  }

  console.log(t.toString())
}).catch(err => {
  debug('error: %j', err)
})
