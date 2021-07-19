'use strict'

const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret
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
  await ws.close()
}

execute()
