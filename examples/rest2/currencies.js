'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-currencies',
  rest: true
}, async ({ debug, debugTable, rest }) => {
  debug('fetching currency list...')

  const currencies = await rest.currencies()

  debug('received %d currencies', currencies[0].length)
  debug('%s', currencies[0].join(', '))
})
