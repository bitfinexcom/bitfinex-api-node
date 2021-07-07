'use strict'

const { RESTv2 } = require('bfx-api-node-rest')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  debug('fetching symbol list...')

  const symbols = await rest.symbols()

  debug('read %d symbols', symbols.length)
  debug('%s', symbols.map(s => `t${s.toUpperCase()}`).join(', '))
}

execute()
