'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_symbols')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching symbol list...')

rest.symbols().then(symbols => {
  debug(
    'available symbols are: %s',
    symbols.map(s => `t${s.toUpperCase()}`).join(', ')
  )
}).catch(err => {
  debug('error: %j', err)
})
