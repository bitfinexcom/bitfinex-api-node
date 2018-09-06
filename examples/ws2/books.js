'use strict'

process.env.DEBUG = 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:books')
const { Manager, subscribe } = require('bfx-api-node-core')
const managerArgs = require('../manager_args')

const mgr = new Manager({ ...managerArgs })

mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  // Returns next socket state
  return subscribe(state, 'book', { symbol: 'tBTCUSD' })
})

mgr.onWS('book', { symbol: 'tBTCUSD' }, (ob) => {
  debug('snapshot or update: %j', ob)
})

debug('opening socket...')

mgr.openWS()
