'use strict'

const _capitalize = require('lodash/capitalize')
const _map = require('lodash/map')
const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'positions',
  rest: { env: true, transform: true }
}, async ({ debug, debugTable, rest }) => {
  debug('fetching positions...')

  const positions = await rest.positions()
  const symbols = _map(positions, 'symbol')

  if (positions.length === 0) {
    return debug('no open positions')
  }

  debug('found %d open positions', positions.length)
  debug('fetching tickers for: %s', symbols.join(', '))

  const prices = {}
  const rawTickers = await rest.tickers(symbols)

  rawTickers.forEach(({ symbol, lastPrice }) => (prices[symbol] = +lastPrice))

  debugTable({
    headers: [
      'ID', 'Symbol', 'Status', 'Amount', 'Base Price', 'Funding Cost',
      'Base Value', 'Net Value', 'P/L', 'P/L %'
    ],

    rows: positions.map((p) => {
      const nv = +prices[p.symbol] * +p.amount
      const pl = nv - (+p.basePrice * +p.amount)
      const plPerc = (pl / nv) * 100.0

      return [
        p.id, p.symbol, _capitalize(p.status), prepareAmount(p.amount),
        preparePrice(p.basePrice), prepareAmount(p.marginFunding),
        prepareAmount(+p.marginFunding + (+p.amount * +p.basePrice)),
        prepareAmount(nv), prepareAmount(pl), plPerc.toFixed(2)
      ]
    })
  })
})
