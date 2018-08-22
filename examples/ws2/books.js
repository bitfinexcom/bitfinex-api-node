'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:books')
const { Manager } = require('bfx-api-node-core')
const subscribe = require('bfx-api-node-core/lib/ws2/subscribe')

const mgr = new Manager({ transform: true })

mgr.onWS('open', {}, (state = {}) => {
  debug('open')

  let wsState = state
  wsState = subscribe(wsState, 'book', { symbol: 'tBTCUSD' })
  return wsState
})

mgr.onWS('book', { symbol: 'tBTCUSD' }, (ob) => {
  debug('%j', ob.toJS())
})

mgr.openWS()
