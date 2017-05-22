'use strict'

const fs = require('fs')
const path = require('path')

const BFX = require('../')
// const BFX = require('bitfinex-api-node')

const API_KEY = null
const API_SECRET = null

const opts = { version: 2 }

const bws = new BFX(API_KEY, API_SECRET, opts).ws

const writeable = fs.createWriteStream(path.join(__dirname, '/ticker.log'))

bws.on('open', () => {
  bws.subscribeTicker('BTCUSD')
})

let length = 0
bws.on('ticker', (pair, ticker) => {
  writeable.write(JSON.stringify(ticker))
  writeable.write('\n')

  length++
  if (length === 5) {
    writeable.end()
    console.log('wrote 5 entries, exiting')
    process.exit(0)
  }
})
