'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:examples:ws2_calc')
const bfx = require('../bfx')
const ws = bfx.ws(2)

ws.on('error', (err) => {
  console.log(err)
})

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.once('auth', () => {
  debug('authenticated')

  setTimeout(() => {
    ws.requestCalc([
      'margin_sym_tBTCUSD',
      'position_tBTCUSD',
      'wallet_margin_BTC',
      'wallet_funding_USD'
    ])

    // Watch log output for balance update packets (wu, miu, etc)
    debug('sent calc')
  }, 5000)
})

ws.open()
