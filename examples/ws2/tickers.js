'use strict'

process.env.DEBUG = 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:tickers')
const { Manager, subscribe } = require('bfx-api-node-core')
const managerArgs = require('../manager_args')

const mgr = new Manager({
  transform: true,
  ...managerArgs
})

mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  let wsState = state
  wsState = subscribe(wsState, 'ticker', { symbol: 'tETHUSD' })
  wsState = subscribe(wsState, 'ticker', { symbol: 'fUSD' })
  return wsState
})

mgr.onWS('ticker', { symbol: 'tETHUSD' }, (ticker) => {
  debug('ETH/USD ticker: %j', ticker.toJS())
})

mgr.onWS('ticker', { symbol: 'fUSD' }, (ticker) => {
  debug('fUSD ticker: %j', ticker.toJS())
})

debug('opening socket...')

mgr.openWS()
