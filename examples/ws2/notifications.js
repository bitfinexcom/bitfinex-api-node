'use strict'

process.env.DEBUG = 'bfx:examples:notifications'

const debug = require('debug')('bfx:examples:notifications')
const bfx = require('../bfx')
const ws = bfx.ws(2)

const run = async () => {
  ws.on('error', (err) => {
    debug('error: %s', err instanceof Error ? err.stack : err)
  })

  ws.onNotification({ type: '*' }, (n) => {
    debug('recv notification: %j', n)
  })

  debug('connecting...')
  await ws.open()
  debug('connected')
  await ws.auth()
  debug('authenticated, listening for notifications')
}

try {
  run()
} catch (e) {
  console.log(`error: ${e.stack}`)
}
