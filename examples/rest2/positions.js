'use strict'

process.env.DEBUG = 'bfx:examples:*'

const co = require('co')
const Table = require('cli-table2')
const debug = require('debug')('bfx:examples:rest2_positions')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

const PL_ENABLED = process.argv[2] === 'pl'
const tableColWidths = [20, 10, 20, 20, 20]
const tableHeaders = [
  'Symbol', 'Status', 'Amount', 'Base Price', 'Funding Cost', 'Base Value'
]

if (PL_ENABLED) {
  tableHeaders.push('Net Value')
  tableHeaders.push('P/L')
  tableHeaders.push('P/L %')
  tableColWidths.push(16)
  tableColWidths.push(20)
  tableColWidths.push(20)
}

const t = new Table({
  colWidths: tableColWidths,
  head: tableHeaders
})

debug('fetching positions...')

co(function * () {
  const positions = yield rest.positions()
  const lastPrices = {}

  debug('... done')

  // Pull in ticker data if we need to calculate P/L
  if (PL_ENABLED) {
    const symbols = positions.map(p => p.symbol)

    debug('fetching tickers for: %s...', symbols)
    const rawTickers = yield rest.tickers(symbols)
    debug('... done')

    for (let i = 0; i < rawTickers.length; i += 1) { // only save lastPrice
      lastPrices[rawTickers[i].symbol] = Number(rawTickers[i].lastPrice)
    }
  }

  for (let i = 0; i < positions.length; i += 1) {
    const p = positions[i]
    p.status = p.status.toLowerCase()
    p.status = `${p.status[0].toUpperCase()}${p.status.substring(1)}`

    const data = [
      p.symbol, p.status, p.amount, p.basePrice, p.marginFunding,
      Number(p.marginFunding) + (Number(p.amount) * Number(p.basePrice))
    ]

    if (PL_ENABLED) {
      const nv = Number(lastPrices[p.symbol]) * Number(p.amount)
      const pl = nv - (p.basePrice * p.amount)
      const plPerc = (pl / nv) * 100.0

      data.push(nv)
      data.push(pl)
      data.push(plPerc)
    }

    t.push(data)
  }

  console.log(t.toString())
}).catch(err => {
  debug('error: %j', err)
})