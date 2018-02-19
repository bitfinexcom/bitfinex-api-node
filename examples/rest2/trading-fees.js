'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_trading_fees')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const t = Table({
  Pair: 10,
  Maker: 10,
  Taker: 10
})

debug('fetching trading fee information...')

rest.accountInfo().then((data = []) => {
  const [ feeData ] = data
  const { fees = [] } = feeData
  let d

  for (let i = 0; i < fees.length; i += 1) {
    d = fees[i]

    t.push([d.pairs, `${d.maker_fees}%`, `${d.taker_fees}%`])
  }

  console.log(t.toString())
}).catch(console.error)
