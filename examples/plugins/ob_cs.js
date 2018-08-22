'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:plugin_ob_cs')
const { Manager } = require('bfx-api-node-core')
const subscribe = require('bfx-api-node-core/lib/ws2/subscribe')

const {
  Config, enableFlag, disableFlag, isFlagEnabled,
} = require('bfx-api-node-core')
const OBChecksumPlugin = require('bfx-api-node-plugin-ob-cs')

const mgr = new Manager({
  transform: true,
  plugins: [OBChecksumPlugin()]
})

mgr.onWS('open', {}, (state = {}) => {
  debug('open')

  let wsState = state
  wsState = subscribe(wsState, 'book', { symbol: 'tBTCUSD' })
  return wsState
})

mgr.openWS()
