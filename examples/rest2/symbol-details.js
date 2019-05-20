'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_symbol_details')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching symbol details...')

rest.symbolDetails().then(res => {
  console.log(JSON.stringify(res, null, 2))
}).catch(err => {
  debug('error: %j', err)
})
