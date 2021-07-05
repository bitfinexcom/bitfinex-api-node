'use strict'

const dotenv = require('dotenv')
const D = require('debug')
const WSv2 = require('../../lib/transports/ws2')
const debug = D('>')
debug.enabled = true

dotenv.config()
const { API_KEY, API_SECRET } = process.env

async function execute () {
  const ws = new WSv2({
    apiKey: API_KEY,
    apiSecret: API_SECRET
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))

  // register a callback for any order snapshot that comes in (account orders)
  ws.onOrderSnapshot({}, (orders) => {
    debug(`order snapshot: ${JSON.stringify(orders, null, 2)}`)
  })

  await ws.open()
  debug('open')

  await ws.auth()
  debug('authenticated')

  // do something with authenticated ws stream
}

execute()
