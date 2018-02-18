'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const co = require('co')
const debug = require('debug')('bfx:examples:rest2_wallets')
const Table = require('../../lib/util/cli_table')
const lastPrices = require('../../lib/util/last_prices')
const { round10 } = require('../../lib/util/numbers')

const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const VALUE_CURRENCY = process.argv[2] // optional
const VALUE_ENABLED = typeof VALUE_CURRENCY === 'string' // no validation
const symbolForWallet = w => `t${w.currency.toUpperCase()}${VALUE_CURRENCY}`

const t = Table(Object.assign({
  Type: 16,
  Currency: 10,
  Total: 20,
  Available: 20,
  'Unsettled Interest': 25
}, !VALUE_ENABLED ? {} : {
  [`Value (${VALUE_CURRENCY})`]: 20,
  [`Unit Price (${VALUE_CURRENCY})`]: 20
}))

debug('fetching wallet data...')

co.wrap(function * () {
  const data = yield rest.wallets()
  const wallets = data.filter(w => Number(w.balance) !== 0)
  const prices = !VALUE_ENABLED
    ? {}
    : yield lastPrices(rest, wallets.map(symbolForWallet), debug)

  let w
  let totalValue = 0

  for (let i = 0; i < wallets.length; i += 1) {
    w = wallets[i]
    w.currency = w.currency.toUpperCase()
    w.type = `${w.type[0].toUpperCase()}${w.type.substring(1)}`

    const rowData = [
      w.type, w.currency, round10(w.balance, 3), round10(w.balanceAvailable, 3),
      w.unsettledInterest
    ]

    if (VALUE_ENABLED) {
      const value = w.currency === VALUE_CURRENCY
        ? w.balance
        : round10(prices[symbolForWallet(w)] * w.balance, 3)

      const unitPrice = w.currency === VALUE_CURRENCY
        ? 1
        : round10(prices[symbolForWallet(w)], 3)

      rowData.push(isNaN(value) ? '' : value)
      rowData.push(Number(unitPrice) === 0 ? '' : unitPrice)

      if (!isNaN(value)) {
        totalValue += Number(value)
      }
    }

    t.push(rowData)
  }

  console.log(t.toString())

  if (VALUE_ENABLED) {
    debug('approx total value: %d %s', totalValue, VALUE_CURRENCY)
  }
})().catch(console.error)
