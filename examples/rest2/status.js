'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-platform-status',
  rest: true
}, async ({ debug, rest }) => {
  debug('fetching platform status...')

  const status = await rest.status()

  debug(status === 0
    ? 'Platform currently under maintenance'
    : 'Platform operating normally'
  )
})
