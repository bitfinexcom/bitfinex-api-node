'use strict'

process.env.DEBUG = 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:candles')
const { Manager, subscribe } = require('bfx-api-node-core')
const managerArgs = require('../manager_args')

const CANDLE_KEY = 'trade:5m:tBTCUSD'
const mgr = new Manager({
  transform: true,
  ...managerArgs
})

mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  // Returns next socket state
  return subscribe(state, 'candles', { key: CANDLE_KEY })
})

mgr.onWS('candles', { key: CANDLE_KEY }, (candles) => {
  candles.forEach(candle => {
    debug('recv BTCUSD candle: %j', candle)
  })
})

debug('opening socket...')

mgr.openWS()
