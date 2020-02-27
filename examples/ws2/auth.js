'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-auth',
  ws: { env: true } // manually open/auth to show usage
}, async ({ ws, debug }) => {
  // register a callback for any order snapshot that comes in (account orders)
  ws.onOrderSnapshot({}, (orders) => {
    debug(`order snapshot: ${JSON.stringify(orders, null, 2)}`)
  })

  await ws.open()
  debug('open')

  await ws.auth()
  debug('authenticated')

  // do something with authenticated ws stream
})
