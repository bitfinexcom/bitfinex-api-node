'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-liquidations',
  ws: { env: true, connect: true }
}, async ({ ws, debug }) => {
  ws.onStatus({ key: 'liq:global' }, (data) => {
    debug('%j', data)
  })

  await ws.subscribeStatus('liq:global')
})
