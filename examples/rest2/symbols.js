'use strict'

const { RESTv2 } = require('bfx-api-node-rest')
const { debug } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    transform: true
  })
  debug('fetching symbol list...')

  const symbols = await rest.symbols()

  debug('read %d symbols', symbols.length)
  debug('%s', symbols.map(s => `t${s.toUpperCase()}`).join(', '))
}

execute()
