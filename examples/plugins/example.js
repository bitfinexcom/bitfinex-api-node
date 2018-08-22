'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:plugin_ob_cs')
const subscribe = require('bfx-api-node-core/lib/ws2/subscribe')
const ExamplePlugin = require('bfx-api-node-plugin-example')
const { Manager, authWS } = require('bfx-api-node-core')

const managerArgs = require('../manager_args')

const mgr = new Manager({
  ...managerArgs,

  transform: true,
  plugins: [ExamplePlugin()],
})

mgr.onWS('open', {}, (state = {}) => {
  debug('open')
  authWS(state)
})

mgr.onWS('auth', {}, (state = {}) => {
  debug('authenticated')
  let wsState = state
  wsState = subscribe(wsState, 'book', { symbol: 'tBTCUSD' })
  wsState = subscribe(wsState, 'trades', { symbol: 'tBTCUSD' })
  wsState = subscribe(wsState, 'ticker', { symbol: 'tBTCUSD' })
  wsState = subscribe(wsState, 'candles', { key: 'trade:5m:tBTCUSD' })
  return wsState
})

mgr.openWS()
