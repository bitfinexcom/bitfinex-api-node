'use strict'

process.env.DEBUG = 'bfx:api:examples:*'

const SocksProxyAgent = require('socks-proxy-agent')
const debug = require('debug')('bfx:api:examples:ws2:trades')
const SeqAuditPlugin = require('bfx-api-node-plugin-seq-audit')
const { Manager, subscribe } = require('bfx-api-node-core')
const managerArgs = require('../manager_args')

const mgr = new Manager({
  plugins: [SeqAuditPlugin()],
  ...managerArgs
})

mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  const { ev } = state
  ev.on('event:auth:success', () => {
    debug('authenticated')
  })

  return subscribe(state, 'trades', { pair: 'BTCUSD' })
})

mgr.onWS('trades', { pair: 'BTCUSD' }, (trades) => {
  trades.forEach(trade => {
    debug('recv BTCUSD trade: %j', trade)
  })
})

mgr.onWS('auth:te', { pair: 'tBTCUSD' }, (trade) => {
  debug('recv account BTCUSD te: %j', trade)
})

mgr.onWS('auth:tu', { pair: 'tBTCUSD' }, (trade) => {
  debug('recv account BTCUSD tu: %j', trade)
})

debug('opening socket...')

mgr.openWS()
