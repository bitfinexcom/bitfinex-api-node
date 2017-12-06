'use strict'

const BFX = require('../')

const bws = new BFX({
  apiKey: '',
  apiSecret: '',
}).ws(2)

bws.open()

bws.on('open', () => {
  bws.subscribeTrades('tBTCUSD')
})

bws.on('trade', (pair, trade) => {
  console.log('Trade:', trade)
})
