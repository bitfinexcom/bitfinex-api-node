'use strict'

const _isArray = require('lodash/isArray')
const _isFinite = require('lodash/isFinite')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-sequencing',
  ws: { env: true, connect: true, auth: true }
}, async ({ ws, debug }) => {
  // Enables internal sequence tracking; an error will be emitted if there is a
  // seq # mis-match
  await ws.enableSequencing({ audit: true })

  if (!ws.isFlagEnabled(65536)) {
    throw new Error('seq enable succeeded, but flag not updated')
  }

  debug('sequencing enabled')

  await ws.subscribeTrades('tBTCUSD')

  ws.on('message', (msg) => {
    if (!_isArray(msg)) return // only array messages have sequence #s

    // auth seq number, available as the last element on chan 0 packets
    const authSeq = msg[0] === 0 && msg[1] !== 'hb'
      ? msg[msg.length - 1]
      : NaN

    // public seq number, last or 2nd to last element on all packets
    const seq = msg[0] === 0 && msg[1] !== 'hb'
      ? msg[msg.length - 2]
      : msg[msg.length - 1]

    if (!_isFinite(authSeq)) {
      debug('recv public seq # %d', seq)
    } else {
      debug('recv public seq # %d, auth seq # %d', seq, authSeq)
    }
  })
})
