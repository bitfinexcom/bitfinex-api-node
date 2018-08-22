'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:plugin-wd')
const { Manager } = require('bfx-api-node-core')
const subscribe = require('bfx-api-node-core/lib/ws2/subscribe')

const {
  Config, enableFlag, disableFlag, isFlagEnabled,
} = require('bfx-api-node-core')
const WDPlugin = require('bfx-api-node-plugin-wd')

const mgr = new Manager({
  transform: true,
  plugins: [WDPlugin()]
})

mgr.onWS('open', {}, (state = {}) => {
  debug('open')

  let wsState = state
  // wsState = subscribe(wsState, 'book', { symbol: 'tBTCUSD' })
  return wsState
})

mgr.openWS()
