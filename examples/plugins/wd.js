'use strict'

process.env.DEBUG = 'bfx:api:plugins:*,bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:plugin-wd')
const { Manager, subscribe } = require('bfx-api-node-core')
const WDPlugin = require('bfx-api-node-plugin-wd')
const managerArgs = require('../manager_args')

const mgr = new Manager({
  transform: true,
  plugins: [WDPlugin()],
  ...managerArgs
})

// We only need to subscribe once, since the manager will automatically
// re-subscribe when the connection re-opens. If this was 'onWS' here, the
// subscribe call would occur twice causing a dup subscription error.
mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  return subscribe(state, 'candles', { key: 'trade:5m:tBTCUSD' })
})

mgr.openWS()
