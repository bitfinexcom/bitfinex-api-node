'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_sequencing')
const bfx = require('../bfx')
const ws = bfx.ws(2)

ws.on('open', () => {
  debug('connection opened')

  // Enables internal sequence tracking; an error will be emitted if there is a
  // seq # mis-match
  ws.enableSequencing({ audit: true }).then(() => {
    if (!ws.isFlagEnabled(65536)) {
      throw new Error('seq enable succeeded, but flag not updated')
    }

    debug('sequencing enabled')
  }).catch(err => {
    debug('failed to enable sequencing: %s', err.message)
  })

  ws.subscribeTrades('tBTCUSD')
  ws.auth()

  ws.on('message', (msg) => {
    if (!Array.isArray(msg)) return // only array messages have sequence #s

    // auth seq number, available as the last element on chan 0 packets
    const authSeq = msg[0] === 0 && msg[1] !== 'hb'
      ? msg[msg.length - 1]
      : NaN

    // public seq number, last or 2nd to last element on all packets
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

ws.on('close', () => {
  debug('connection closed')
})

ws.on('auth', () => {
  debug('authenticated')
})

// An error will emit on an invalid seq #
ws.on('error', err => {
  debug('error: %s', err.message)
})

ws.open()
