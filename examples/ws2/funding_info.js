'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:funding_info')
const bfx = require('../bfx')
const ws = bfx.ws(2)

const symbol = 'fUSD'

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.once('auth', () => {
  setTimeout(() => {
    ws.requestCalc([
      `funding_sym_${symbol}`,
    ])
  })    
})

ws.onFundingInfoUpdate({}, fiu => {
  fiu.forEach(fl => {
    debug('fl: %j', fl)
  })
})

ws.open()
