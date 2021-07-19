'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const { RESTv2 } = require('../../index')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  debug('fetching margin info...')

  const info = await rest.marginInfo()
  const { userPL, userSwaps, marginBalance, marginNet } = info

  debug('')
  debug('Swaps: %d', userSwaps)
  debug('P/L: %s', prepareAmount(userPL))
  debug('Balance: %s', prepareAmount(marginBalance))
  debug('Net Balance: %s', prepareAmount(marginNet))
  debug('')
}

execute()
