'use strict'

const Promise = require('bluebird')
const { FundingOffer } = require('bfx-api-node-models')
const { RESTv2 } = require('bfx-api-node-rest')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')

const CLOSE_DELAY_MS = 5 * 1000

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
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
}

execute()
