'use strict'

const fs = require('fs')
const path = require('path')
const BFX = require('../')

const API_KEY = ''
const API_SECRET = ''
const bfx = new BFX({
  apiKey: '',
  apiSecret: '',
  transform: true
})

const bws = bfx.ws(2)
bws.open()

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
