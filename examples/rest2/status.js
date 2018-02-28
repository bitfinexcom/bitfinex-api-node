'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_status')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching platform status...')

rest.status().then(status => {
  debug(status === 0
    ? 'Platform currently under maintenance'
    : 'Platform operating normally'
  )
}).catch(err => {
  debug('error: %j', err)
})
