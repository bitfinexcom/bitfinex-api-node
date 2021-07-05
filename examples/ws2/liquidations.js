'use strict'

const { Liquidations } = require('bfx-api-node-models')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  ws.onStatus({ key: 'liq:global' }, (data) => {
    data.forEach(liq => (
      debug('liquidation: %s', new Liquidations(liq).toString())
    ))
  })

  await ws.subscribeStatus('liq:global')
}

execute()
