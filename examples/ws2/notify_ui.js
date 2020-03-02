'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-notify-ui',
  ws: { env: true, connect: true, auth: true, transform: true }
}, async ({ ws, debug }) => {
  ws.notifyUI({
    type: 'success',
    message: 'This is a test notification sent via the WSv2 API'
  })

  debug('notification sent')
})
