'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:tickers')
const { Manager } = require('bfx-api-node-core')
const subscribe = require('bfx-api-node-core/lib/ws2/subscribe')

const mgr = new Manager({ transform: true })

mgr.onWS('open', {}, (state = {}) => {
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

mgr.openWS()
