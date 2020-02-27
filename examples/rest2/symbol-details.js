'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-symbol-details',
  rest: true
}, async ({ rest, debug, debugTable }) => {
  debug('fetching symbol details...')

  const details = await rest.symbolDetails()

  debugTable({
    headers: [
      'Pair', 'Precision', 'Initial Margin', 'Min Margin', 'Max Order',
      'Min Order', 'Margin'
    ],

    rows: details.map(({
      pair, price_precision, initial_margin, minimum_margin, // eslint-disable-line
      maximum_order_size, minimum_order_size, margin // eslint-disable-line
    }) => [
      pair.toUpperCase(), price_precision, initial_margin, minimum_margin, // eslint-disable-line
      maximum_order_size, minimum_order_size, margin ? 'Y' : 'N' // eslint-disable-line
    ])
  })
})
