'use strict'

process.env.DEBUG = 'bfx:api:*'

const debug = require('debug')('bfx:api:examples:ws2:info_events')
const bfx = require('../legacy_bfx.js')

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

  ws.onMaintenanceStart({}, () => {
    debug('info: maintenance period started')
    // pause activity untill further notice
  })

  ws.onMaintenanceEnd({}, () => {
    debug('info: maintenance period ended')
    // resume activity
  })

  ws.onServerRestart({}, () => {
    debug('info: bitfinex ws server restarted')
    // ws.reconnect() // if not using autoReconnect
  })
})

ws.open()
