'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_wallets')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = Table({
  Type: 14,
  Currency: 10,
  Balance: 14,
  Available: 14,
  'Unsettled Interest': 20
})

debug('fetching wallets...')

rest.wallets().then(wallets => {
  let w

  for (let i = 0; i < wallets.length; i += 1) {
    w = wallets[i].toUI()
    w.type = `${w.type[0].toUpperCase()}${w.type.substring(1)}`

    if (!w.balanceAvailable) w.balanceAvailable = '-'

    t.push([
      w.type, w.currency, w.balance, w.unsettledInterest, w.balanceAvailable
    ])
  }

  console.log(t.toString())
}).catch(console.error)
