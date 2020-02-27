'use strict'

const Promise = require('bluebird')
const runExample = require('../util/run_example')

const TABLE_DEF = {
  headers: ['Symbol', 'Status', 'Amount', 'Base Price', 'Liq Price', 'P/L']
}

module.exports = runExample({
  name: 'rest-claim-positions',
  rest: { env: true, transform: true },
  ws: { env: true, transform: true, connect: true, auth: true }
}, async ({ debug, debugTable, rest, ws }) => {
  const positions = await rest.positions()

  if (positions.length === 0) {
    debug('no open positions')
    return ws.close()
  }

  debug(
    'found %d open positions on market(s) %s\n', positions.length,
    positions.map(({ symbol }) => symbol).join(',')
  )

  debugTable(TABLE_DEF, positions.map(p => ([
    p.symbol, p.status, p.amount, p.basePrice, p.liqPrice, p.pl
  ])))

  debug('claiming all positions...')

  await Promise.all(positions.map(p => p.claim(ws)))

  debug('new position data:')
  debugTable(TABLE_DEF, positions.map(p => ([
    p.symbol, p.status, p.amount, p.basePrice, p.liqPrice, p.pl
  ])))

  await ws.close()
})
