'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-info-events',
  ws: {
    env: true, connect: true, auth: true, autoReconnect: true
  }
}, async ({ ws, debug }) => {
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
})
