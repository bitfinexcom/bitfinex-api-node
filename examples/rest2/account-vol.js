'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_account_vol')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = Table({
  Currency: 20,
  Volume: 17
})

debug('fetching account trading volume...')

rest.accountSummary().then((data = {}) => {
  const tradeVol = data['trade_vol_30d'] || []
  let e

  for (let i = 0; i < tradeVol.length; i += 1) {
    e = tradeVol[i]

    t.push([e.curr, e.vol])
  }

  console.log(t.toString())
}).catch(console.error)
