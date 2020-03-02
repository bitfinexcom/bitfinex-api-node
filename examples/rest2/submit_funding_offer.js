'use strict'

const Promise = require('bluebird')
const { FundingOffer } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

const CLOSE_DELAY_MS = 5 * 1000

module.exports = runExample({
  name: 'rest-submit-funding-offer',
  rest: { env: true, transform: true }
}, async ({ debug, rest, params }) => {
  const fo = new FundingOffer({
    type: 'LIMIT',
    symbol: 'fUSD',
    rate: 0.0120000,
    amount: 120,
    period: 2
  }, rest)

  debug('submitting: %s', fo.toString())

  try {
    await fo.submit()
  } catch (e) {
    return debug('failed: %s', e.message)
  }

  debug('done. closing in %ds...', CLOSE_DELAY_MS / 1000)

  await Promise.delay(CLOSE_DELAY_MS)
  await fo.close()

  debug('offer closed')
})
