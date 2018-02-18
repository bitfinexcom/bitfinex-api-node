'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_positions')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = Table({
  ID: 14,
  GID: 14,
  CID: 14,
  Created: 20,
  Updated: 20,
  Symbol: 10,
  Type: 20,
  Amount: 16,
  Price: 16,
  Status: 20
})

debug('fetching orders...')

rest.activeOrders().then(orders => {
  if (orders.length === 0) return debug('no open orders')

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
}).catch(console.error)
