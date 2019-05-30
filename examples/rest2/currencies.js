'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_currencies')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching currency list...')

rest.currencies().then(currencies => {
  console.log(JSON.stringify(currencies, null, 2))
}).catch(err => {
  debug('error: %j', err)
})
