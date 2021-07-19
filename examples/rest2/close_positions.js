'use strict'

const PI = require('p-iteration')
const _isEmpty = require('lodash/isEmpty')
const WSv2 = require('../../lib/transports/ws2')
const { RESTv2 } = require('../../index')
const { args: { apiKey, apiSecret }, debug, debugTable, readline } = require('../util/setup')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const filterByMarket = null
  const allPositions = await rest.positions()
  await ws.open()
  await ws.auth()

  if (allPositions.length === 0) {
    debug('no open positions')
    await ws.close()
    readline.close()
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
    await ws.close()
    readline.close()
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
    await ws.close()
    readline.close()
    return
  }

  debug('')

  ws.onOrderClose({}, ({ id, symbol, status }) => {
    debug('received confirmation of order %d closed on %s: %s', id, symbol, status)
  })

  await PI.forEachSeries(orders, o => o.submit())

  debug('')
  debug('closed %d positions', positions.length)

  await ws.close()
  readline.close()
}

execute()
