'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-key-permissions',
  rest: {
    env: true,
    transform: true
  }
}, async ({ debug, debugTable, rest }) => {
  debug('fetching permissions')

  const perms = await rest.keyPermissions()

  const rows = perms.map(({ key, read, write }) => [
    key.toUpperCase(), read ? 'Y' : 'N', write ? 'Y' : 'N'
  ])

  debugTable({
    rows,
    headers: ['Scope', 'Read', 'Write']
  })
})
