'use strict'

process.env.DEBUG = 'bfx:examples:*'

const Table = require('cli-table2')
const debug = require('debug')('bfx:examples:rest2_balances')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const tableHeaders = ['Type', 'Symbol', 'Total', 'Available']
const tableColWidths = [20, 10, 20, 20]

const VALUE_CURRENCY = process.argv[2] // optional
const VALUE_ENABLED = typeof VALUE_CURRENCY === 'string' // we do no validation
const symbolForWallet = w => `t${w.currency.toUpperCase()}${VALUE_CURRENCY}`

if (VALUE_ENABLED) {
  tableHeaders.push(`Value (${VALUE_CURRENCY})`)
  tableHeaders.push(`Unit Price (${VALUE_CURRENCY})`)
  tableColWidths.push(20)
  tableColWidths.push(20)
}

const t = new Table({
  head: tableHeaders,
  colWidths: tableColWidths
})

debug('fetching balances...')

const example = async () => {
  const balances = await rest.balances() // actual balance fetch
  const lastPrices = {}

  // Pull in ticker data if the user specified a value currency
  // Balance in BTC, value in USD -> We need to fetch tBTCUSD (last price)
  if (VALUE_ENABLED) {
    const symbols = Array.from(new Set(balances
      .filter(w => (
        (w.currency.toUpperCase() !== VALUE_CURRENCY) && // already in val curr
        (w.available !== '0.0' || w.amount === '0.0') // empty balance, ignore
      )).map(w => symbolForWallet(w))))

    debug('fetching tickers for: %s...', symbols.join(', '))
    const rawTickers = await rest.tickers(symbols)
    debug('... done')

    for (let i = 0; i < rawTickers.length; i += 1) { // only save lastPrice
      lastPrices[rawTickers[i].symbol] = Number(rawTickers[i].lastPrice)
    }
  }

  let w
  let totalValue = 0

  for (let i = 0; i < balances.length; i += 1) {
    w = balances[i]
    if (w.available === '0.0' && w.amount === '0.0') continue

    w.currency = w.currency.toUpperCase()
    w.type = `${w.type[0].toUpperCase()}${w.type.substring(1)}`

    const rowData = [
      w.type, w.currency, w.amount, w.available
    ]

    if (VALUE_ENABLED) {
      const value = w.currency === VALUE_CURRENCY
        ? w.amount
        : lastPrices[symbolForWallet(w)] * w.amount

      const unitPrice = w.currency === VALUE_CURRENCY
        ? 1
        : lastPrices[symbolForWallet(w)]

      rowData.push(Number.isNaN(+value) ? '' : value)
      rowData.push(unitPrice)

      if (!Number.isNaN(+value)) {
        totalValue += Number(value)
      }
    }

    t.push(rowData)
  }

  console.log(t.toString())

  if (VALUE_ENABLED) {
    debug('total value: %d %s', totalValue, VALUE_CURRENCY)
  }
}

example().catch(debug)
