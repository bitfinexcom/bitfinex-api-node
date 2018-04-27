'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:funding_credits')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching funding credits...')

rest.fundingCredits('fUSD').then(fcs => {
  fcs.forEach(fc => {
    debug('fc: %j', fc)
  })
}).catch(debug)
