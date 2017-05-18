'use strict'

// uses the latest version of the websocket API

// const BFX = require ('../')
const BFX = require('bitfinex-api-node')

const API_KEY = null
const API_SECRET = null

const opts = { version: 2 }

const bws = new BFX(API_KEY, API_SECRET, opts).ws

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
