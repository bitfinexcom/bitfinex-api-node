'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:funding_info')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching funding info...')

rest.fundingInfo('fUSD').then(fiu => {
  fiu.forEach(fl => {
    debug('fl: %j', fl)
  })
}).catch(debug)
