'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-notifications',
  ws: { env: true, connect: true, auth: true, transform: true }
}, async ({ ws, debug }) => {
  ws.onNotification({ type: '*' }, (n) => {
    debug('recv notification: %j', n.toJS())
  })
})
