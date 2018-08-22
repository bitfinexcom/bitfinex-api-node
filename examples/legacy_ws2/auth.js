'use strict'

process.env.DEBUG = 'bfx:api:*'

const debug = require('debug')('bfx:api:examples:ws2:auth')
const bfx = require('../legacy_bfx.js')
const ws = bfx.ws(2)

ws.on('open', () => { // wait for socket open
  ws.auth() // & authenticate

  debug('open')
})

ws.on('error', (err) => {
  debug('error: %j', err)
})

ws.once('auth', () => {
  debug('authenticated')

  // do something with authenticated ws stream
})

// Register a callback for any order snapshot that comes in (account orders)
ws.onOrderSnapshot({}, (orders) => {
  debug(`order snapshot: ${JSON.stringify(orders, null, 2)}`)
})

// Open the websocket connection
ws.open()
