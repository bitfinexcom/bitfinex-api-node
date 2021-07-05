'use strict'

const Promise = require('bluebird')
const dotenv = require('dotenv')
const D = require('debug')
const WSv2 = require('../../lib/transports/ws2')
const debug = D('>')
debug.enabled = true

dotenv.config()
const { API_KEY, API_SECRET } = process.env

async function execute () {
  const ws = new WSv2({
    apiKey: API_KEY,
    apiSecret: API_SECRET
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
