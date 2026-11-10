'use strict'

const { RESTv2 } = require('../../index')
const { debug, debugTable } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    transform: true
  })
  debug('fetching symbol details...')

  const details = await rest.symbolDetails()

  debugTable({
    headers: [
      'Pair', 'Initial Margin', 'Min Margin', 'Max Order',
      'Min Order', 'Margin'
    ],

    rows: details.map(({
      pair, initialMargin, minimumMargin,
      maximumOrderSize, minimumOrderSize, margin
    }) => [
      pair.toUpperCase(), initialMargin, minimumMargin,
      maximumOrderSize, minimumOrderSize, margin ? 'Y' : 'N'
    ])
  })
}

execute()
