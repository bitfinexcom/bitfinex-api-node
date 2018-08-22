'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:funding_loans')
const bfx = require('../legacy_bfx.js')
const rest = bfx.rest(2)

debug('fetching funding loans...')

rest.fundingLoans('fUSD').then(fls => {
  fls.forEach(fl => {
    debug('fl: %j', fl)
  })
}).catch(debug)
