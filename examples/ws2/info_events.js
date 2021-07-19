'use strict'

const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    autoReconnect: true
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()
  await ws.auth()

  ws.onMaintenanceStart(() => {
    debug('info: maintenance period started')
    // pause activity untill further notice
  })

  ws.onMaintenanceEnd(() => {
    debug('info: maintenance period ended')
    // resume activity
  })

  ws.onServerRestart(() => {
    debug('info: bitfinex ws server restarted')
    // await ws.reconnect() // if not using autoReconnect
  })
  await ws.close()
}

execute()
