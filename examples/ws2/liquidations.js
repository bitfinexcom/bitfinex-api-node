'use strict'

const { Liquidations } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-liquidations',
  ws: { env: true, connect: true, keepOpen: true }
}, async ({ ws, debug }) => {
  ws.onStatus({ key: 'liq:global' }, (data) => {
    data.forEach(liq => (
      debug('liquidation: %s', new Liquidations(liq).toString())
    ))
  })

  await ws.subscribeStatus('liq:global')
})
