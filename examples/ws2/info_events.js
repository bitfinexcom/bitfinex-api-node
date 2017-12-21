'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_info_events')
const bfx = require('../bfx')

const ws = bfx.ws(2, {
  autoReconnect: true
})

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.on('error', (err) => {
  debug('error: %j', err)
})

ws.once('auth', () => {
  debug('authenticated')

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
    // ws.reconnect() // if not using autoReconnect
  })
})

ws.open()
