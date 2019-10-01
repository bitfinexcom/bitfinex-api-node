'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:submit_order')
const bfx = require('../bfx')
const { FundingOffer } = require('bfx-api-node-models')
const rest = bfx.rest(2, { transform: true })

debug('Submitting new order...')

 // Build new order
 const fo = new FundingOffer({
  type: 'LIMIT',
  symbol: 'fUSD',
  rate: 0.0120000,
  amount: 120,
  period: 2
}, rest)

fo.submit().then((fo) => {
  debug("Submitted funding offer", fo.id)
})
.catch((err) => console.log(err))

// cancel offer

// setTimeout(() => {
//   fo.cancel()
// }, 5000)

setTimeout(() => {
  fo.close()
}, 5000)
