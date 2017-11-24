'use strict'

const BFX = require('../')

const API_KEY = ''
const API_SECRET = ''
const opts = {
  version: 2,
  autoOpen: true
}

const bws = new BFX(API_KEY, API_SECRET, opts).ws

bws.on('open', () => {
  bws.subscribeTrades('tBTCUSD')
})

bws.on('trade', (pair, trade) => {
  console.log('Trade:', trade)
})
