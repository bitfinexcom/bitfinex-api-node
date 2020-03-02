'use strict'

const PI = require('p-iteration')
const _isEmpty = require('lodash/isEmpty')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-close-positions',
  rest: { env: true, transform: true },
  ws: { env: true, transform: true, connect: true, auth: true },
  readline: true,
  params: {
    filterByMarket: null
  }
}, async ({
  debug, debugTable, rest, ws, params, readline
}) => {
  const { filterByMarket } = params
  const allPositions = await rest.positions()

  if (allPositions.length === 0) {
    debug('no open positions')
    return
  }

  debug(
    'found %d open positions on market(s) %s', allPositions.length,
    allPositions.map(({ symbol }) => symbol).join(',')
  )

  const positions = _isEmpty(filterByMarket)
    ? allPositions
    : allPositions.filter(({ symbol }) => symbol === filterByMarket)

  if (positions.length === 0) {
    debug('no positions match filter')
    return
  }

  const orders = positions.map(p => p.orderToClose(ws))

  debugTable({
    headers: [
      'ID', 'Symbol', 'Status', 'Amount', 'Base Price', 'P/L'
    ],

    rows: positions.map(p => ([
      p.id, p.symbol, p.status, p.amount, p.basePrice, p.pl
    ]))
  })

  orders.forEach(o => (debug('%s', o.toString())))
  debug('')

  const confirm = await readline.questionAsync(
    '>  Are you sure you want to submit the order(s) listed above? '
  )

  if (confirm.toLowerCase()[0] !== 'y') {
    return
  }

  debug('')

  ws.onOrderClose({}, ({ id, symbol, status }) => {
    debug('received confirmation of order %d closed on %s: %s', id, symbol, status)
  })

  await PI.forEachSeries(orders, o => o.submit())

  debug('')
  debug('closed %d positions', positions.length)
})
