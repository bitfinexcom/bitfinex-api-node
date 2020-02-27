'use strict'

const Promise = require('bluebird')
const { Order } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

const delay = (ms) => new Promise(resolve => (setTimeout(resolve, ms)))

const UPDATE_DELAY_MS = 5 * 1000
const CANCEL_DELAY_MS = 10 * 1000

module.exports = runExample({
  name: 'rest-submit-order',
  rest: { env: true }
}, async ({ rest, debug }) => {
  const o = new Order({
    cid: Date.now(),
    symbol: 'tLEOUSD',
    price: 2,
    amount: -6,
    type: Order.type.LIMIT,
    affiliateCode: 'xZvWHMNR'
  }, rest)

  debug('submitting order: %s', o.toString())

  await o.submit()

  debug('order successfully submitted! (id %j, cid %j, gid %j)', o.id, o.cid, o.gid)
  debug('')
  debug('will update price to $3.00 in %fs...', UPDATE_DELAY_MS / 1000)

  await delay(UPDATE_DELAY_MS)

  debug('')
  debug('updating order price...')

  const updateNotification = await o.update({ price: 3 })
  debug('successfully updated! (%s: %s)', updateNotification.status, updateNotification.text)
  debug('')
  debug('will cancel the order in %fs', CANCEL_DELAY_MS / 1000)

  await delay(CANCEL_DELAY_MS)

  debug('')
  debug('cancelling order...')

  const cancelNotification = await o.cancel()
  debug('successfully canceled! (%s: %s)', cancelNotification.status, cancelNotification.text)
})
