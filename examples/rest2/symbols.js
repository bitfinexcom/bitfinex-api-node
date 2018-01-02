'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_symbols')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching symbol list...')

rest.symbols((err, symbols) => {
  if (err) return debug('error: %s', err.message)

  debug('available symbols are: %s', symbols.join(', '))
})
