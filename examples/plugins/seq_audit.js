'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:api:examples:ws2:plugin_seq_audit')
const { Manager, subscribe } = require('bfx-api-node-core')

const {
  Config, enableFlag, disableFlag, isFlagEnabled,
} = require('bfx-api-node-core')
const SeqAuditPlugin = require('bfx-api-node-plugin-seq-audit')
const managerArgs = require('../manager_args')

const mgr = new Manager({
  transform: true,
  plugins: [SeqAuditPlugin()],
  ...managerArgs
})

mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  return subscribe(state, 'book', { symbol: 'tBTCUSD' })
})

mgr.openWS()
