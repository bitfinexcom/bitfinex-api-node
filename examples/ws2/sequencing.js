'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_sequencing')
const bfx = require('../bfx')
const ws = bfx.ws(2, { seqAudit: true })

ws.on('open', () => {
  debug('connection opened')

  ws.enableSequencing()
  ws.subscribeTrades('tBTCUSD')

  ws.auth()

  ws.on('message', (msg) => {
    if (!Array.isArray(msg)) return // only array messages have sequence #s

    const authSeq = msg[0] === 0 && msg[1] !== 'hb'
      ? msg[msg.length - 1]
      : NaN

    const seq = msg[0] === 0 && msg[1] !== 'hb'
      ? msg[msg.length - 2]
      : msg[msg.length - 1]

    if (Number.isNaN(authSeq)) {
      debug('recv public seq # %d', seq)
    } else {
      debug('recv public seq # %d, auth seq # %d', seq, authSeq)
    }
  })
})

ws.on('auth', () => {
  debug('authenticated')
})

// An error will emit on an invalid seq #
ws.on('error', err => {
  debug('error: %s', err.message)
})

ws.open()
