'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:funding_offers')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching funding offers...')

rest.fundingOffers('fUSD').then(fos => {
  fos.forEach(fo => {
    debug('fo: %j', fo)
  })
}).catch(debug)
