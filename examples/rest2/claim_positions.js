'use strict'

const { RESTv2 } = require('../../index')
const _isEmpty = require('lodash/isEmpty')
const { args: { apiKey, apiSecret }, debug, debugTable, readline } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const filterByMarket = false
  const allPositions = await rest.positions()
  const positions = _isEmpty(filterByMarket)
    ? allPositions
    : allPositions.filter(({ symbol }) => symbol === filterByMarket)

  if (positions.length === 0) {
    debug('no positions match filter')
    return
  }

  debug(
    'found %d open positions on market(s) %s\n', positions.length,
    positions.map(({ symbol }) => symbol).join(',')
  )

  debugTable({
    headers: ['Symbol', 'Status', 'Amount', 'Base Price', 'P/L'],
    rows: positions.map(p => ([
      p.symbol, p.status, p.amount, p.basePrice, p.pl
    ]))
  })

  const confirm = await readline.questionAsync(
    '>  Are you sure you want to claim the position(s) listed above? '
  )

  if (confirm.toLowerCase()[0] !== 'y') {
    return
  }

  debug('')
  debug('claiming positions...')

  await Promise.all(positions.map(p => p.claim(rest)))

  debug('done!')
  readline.close()
}

execute()
