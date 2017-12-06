'use strict'

const BFX = require('../')

const bws = new BFX({
  apiKey: '',
  apiSecret: '',
}).ws(2)

bws.open()

bws.on('open', () => {
  bws.subscribeTrades('BTCUSD')
  bws.subscribeOrderBook('BTCUSD')
  bws.subscribeTicker('LTCBTC')
})

bws.on('trade', (pair, trade) => {
  console.log('Trade:', trade)
})

bws.on('orderbook', (pair, book) => {
  console.log('Order book:', book)
})

bws.on('ticker', (pair, ticker) => {
  console.log('Ticker:', ticker)
})

bws.on('subscribed', (data) => {
  console.log('New subscription', data)
})

bws.on('error', console.error)
