'use strict'

const debug = require('debug')('bfx:examples:ws2_sequencing')
const bfx = require('../bfx')
const ws = bfx.ws(2, { seqAudit: true })

ws.on('open', () => {
  debug('connection opened')

  ws.enableSequencing()
  ws.subscribeTrades('tBTCUSD')

  ws.on('message', (msg) => {
    debug('msg: %j', msg)
  })
})

// An error will emit on an invalid seq #
ws.on('error', (err) => {
  debug('error: %j', err)
})

ws.open()
