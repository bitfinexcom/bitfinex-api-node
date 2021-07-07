'use strict'

const { RESTv2 } = require('bfx-api-node-rest')
const { args: { apiKey, apiSecret }, debug, debugTable } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  debug('fetching permissions')

  const perms = await rest.keyPermissions()

  const rows = perms.map(({ key, read, write }) => [
    key.toUpperCase(), read ? 'Y' : 'N', write ? 'Y' : 'N'
  ])

  debugTable({
    rows,
    headers: ['Scope', 'Read', 'Write']
  })
}

execute()
