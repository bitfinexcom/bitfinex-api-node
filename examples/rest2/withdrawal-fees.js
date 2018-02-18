'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_withdrawal_fees')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = Table({
  Currency: 10,
  Fee: 14
})

debug('fetching withdrawal fee information...')

rest.accountFees().then((data = {}) => {
  const { withdraw = {} } = data
  const currencies = Object.keys(withdraw)
  let c

  for (let i = 0; i < currencies.length; i += 1) {
    c = currencies[i]
    t.push([c, withdraw[c]])
  }

  console.log(t.toString())
}).catch(console.error)
