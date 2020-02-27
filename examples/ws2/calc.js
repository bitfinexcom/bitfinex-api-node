'use strict'

const Promise = require('bluebird')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-calc',
  ws: { env: true, connect: true, auth: true }
}, async ({ ws, debug }) => {
  await new Promise(resolve => setTimeout(resolve, 5 * 1000))

  ws.requestCalc([
    'margin_sym_tBTCUSD',
    'position_tBTCUSD',
    'wallet_margin_BTC',
    'wallet_funding_USD'
  ])

  // Watch log output for balance update packets (wu, miu, etc)
  debug('sent calc, closing in 30s...')

  await new Promise(resolve => setTimeout(resolve, 30 * 1000))
  await ws.close()
})
