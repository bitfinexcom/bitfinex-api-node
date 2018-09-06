'use strict'

process.env.DEBUG = '*' // 'bfx:api:examples:*'

const debug = require('debug')('bfx:api:examples:ws2:orders')
const { Manager, submitOrder } = require('bfx-api-node-core')
const { Order } = require('bfx-api-node-models')
const SeqAuditPlugin = require('bfx-api-node-plugin-seq-audit')
const managerArgs = require('../manager_args')

const mgr = new Manager({
  plugins: [SeqAuditPlugin()],
  transform: true,
  ...managerArgs
})

// Build new order
const o = new Order({
  cid: Date.now(),
  symbol: 'tBTCUSD',
  price: 30000,
  amount: -0.02,
  type: Order.type.EXCHANGE_LIMIT
})

mgr.onceWS('open', {}, (state = {}) => {
  debug('open')

  const { ev } = state
  ev.on('event:auth:success', async () => {
    try {
      const on = await submitOrder(state, o)

      debug('submitted order: %j', on)
    } catch (e) {
      debug('error: %s', e)
    }
  })

  return state
})

debug('opening socket...')

mgr.openWS()
