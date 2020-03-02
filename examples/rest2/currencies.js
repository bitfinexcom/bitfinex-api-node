'use strict'

const _chunk = require('lodash/chunk')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-currencies',
  rest: true
}, async ({ debug, rest }) => {
  debug('fetching currency list...')

  const currencies = await rest.currencies()

  debug('received %d currencies', currencies[0].length)

  debug('')
  _chunk(currencies[0], 10).forEach((currencyChunk) => {
    debug('%s', currencyChunk.join(', '))
  })
  debug('')
})
