'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const co = require('co')
const debug = require('debug')('bfx:examples:rest2_positions')
const Table = require('../../lib/util/cli_table')
const lastPrices = require('../../lib/util/last_prices')
const { round10 } = require('../../lib/util/numbers')

const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const PL_ENABLED = process.argv[2] === 'pl'
const t = Table(Object.assign({
  Symbol: 10,
  Status: 10,
  Amount: 14,
  'Base Price': 14,
  'Funding Cost': 14,
  'Base Value': 14
}, !PL_ENABLED ? {} : {
  'Net Value': 14,
  'P/L': 14,
  'P/L %': 14,
  'Quote': 14
}))

debug('fetching positions...')

co.wrap(function * () {
  const positions = yield rest.positions()
  debug('...done')

  const prices = !PL_ENABLED
    ? {}
    : yield lastPrices(rest, positions.map(p => p.symbol), debug)

  for (let i = 0; i < positions.length; i += 1) {
    const p = positions[i].toUI()
    p.status = p.status.toLowerCase()
    p.status = `${p.status[0].toUpperCase()}${p.status.substring(1)}`

    const data = [
      p.symbol, p.status, p.amount, p.basePrice, p.marginFunding,
      round10(
        Number(p.marginFunding) + (Number(p.amount) * Number(p.basePrice)),
        3
      )
    ]

    if (PL_ENABLED) {
      const nv = Number(prices[p.symbol]) * Number(p.amount)
      const pl = nv - (p.basePrice * p.amount)
      const plPerc = (pl / nv) * 100.0

      data.push(round10(nv, 3))
      data.push(round10(pl, 3))
      data.push(round10(plPerc, 3))
      data.push(p.symbol.substring(4))
    }

    t.push(data)
  }

  console.log(t.toString())
})().catch(console.error)
