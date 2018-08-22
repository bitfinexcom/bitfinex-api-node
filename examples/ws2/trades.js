'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:trades')
const { Manager } = require('bfx-api-node-core')
const subscribe = require('bfx-api-node-core/lib/ws2/subscribe')

const mgr = new Manager({ transform: true })

mgr.onWS('open', {}, (state = {}) => {
  debug('open')

  let wsState = state
  wsState = subscribe(wsState, 'trades', { pair: 'BTCUSD' })
  return wsState
})

mgr.onWS('trades', { pair: 'BTCUSD' }, (trades) => {
  trades.forEach(trade => {
    debug('recv BTCUSD trade: %j', trade)
  })
})

mgr.openWS()
