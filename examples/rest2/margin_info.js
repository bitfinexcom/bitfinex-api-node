'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-margin-info',
  rest: { env: true, transform: true }
}, async ({ debug, rest }) => {
  debug('fetching margin info...')

  const info = await rest.marginInfo()
  const { userPL, userSwaps, marginBalance, marginNet } = info

  debug('')
  debug('Swaps: %d', userSwaps)
  debug('P/L: %s', prepareAmount(userPL))
  debug('Balance: %s', prepareAmount(marginBalance))
  debug('Net Balance: %s', prepareAmount(marginNet))
  debug('')
})
