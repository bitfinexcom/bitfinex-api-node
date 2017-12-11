'use strict'

const BFX = require('../')
const bfx = new BFX({
  apiKey: '',
  apiSecret: ''
})

const ws = bfx.ws(2, { seqAudit: true })

ws.on('open', () => {
  console.log('connection opened')

  ws.enableSequencing()
  ws.subscribeTrades('tBTCUSD')

  ws.on('message', (msg) => {
    console.log(msg)
  })
})

// An error will emit on an invalid seq #
ws.on('error', (err) => {
  console.error(err)
})

ws.open()
