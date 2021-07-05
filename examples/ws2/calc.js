'use strict'

const Promise = require('bluebird')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()
  await ws.auth()

  await Promise.delay(5 * 1000)

  ws.requestCalc([
    'margin_sym_tBTCUSD',
    'position_tBTCUSD',
    'wallet_margin_BTC',
    'wallet_funding_USD'
  ])

  // Watch log output for balance update packets (wu, miu, etc)
  debug('sent calc, closing in 3s...')

  await Promise.delay(3 * 1000)
  await ws.close()
}

execute()
