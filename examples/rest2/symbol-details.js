'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-symbol-details',
  rest: { transform: true }
}, async ({ rest, debug, debugTable }) => {
  debug('fetching symbol details...')

  const details = await rest.symbolDetails()

  debugTable({
    headers: [
      'Pair', 'Initial Margin', 'Min Margin', 'Max Order',
      'Min Order', 'Margin'
    ],

    rows: details.map(({
      pair, initialMargin, minimumMargin, // eslint-disable-line
      maximumOrderSize, minimumOrderSize, margin // eslint-disable-line
    }) => [
      pair.toUpperCase(), initialMargin, minimumMargin, // eslint-disable-line
      maximumOrderSize, minimumOrderSize, margin ? 'Y' : 'N' // eslint-disable-line
    ])
  })
})
