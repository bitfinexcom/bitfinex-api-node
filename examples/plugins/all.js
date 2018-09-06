'use strict'

process.env.DEBUG = 'bfx:api:plugins:*,bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:plugin-wd')
const { Manager, subscribe } = require('bfx-api-node-core')

const {
  Config, enableFlag, disableFlag, isFlagEnabled,
} = require('bfx-api-node-core')

const SeqAuditPlugin = require('bfx-api-node-plugin-seq-audit')
const OBChecksumPlugin = require('bfx-api-node-plugin-ob-cs')
const WDPlugin = require('bfx-api-node-plugin-wd')
const managerArgs = require('../manager_args')

const mgr = new Manager({
  transform: true,
  plugins: [
    WDPlugin(),
    OBChecksumPlugin(),
    SeqAuditPlugin(),
  ],

  ...managerArgs
})

mgr.onWS('open', {}, (state = {}) => {
  debug('open')

  return subscribe(state, 'book', { symbol: 'tBTCUSD' })
})

debug('opening socket...')

mgr.openWS()
