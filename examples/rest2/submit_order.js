'use strict'

const { Order } = require('bfx-api-node-models')
const { RESTv2 } = require('../../index')
const { args: { apiKey, apiSecret }, debug, readline } = require('../util/setup')

const UPDATE_DELAY_MS = 5 * 1000
const CANCEL_DELAY_MS = 10 * 1000

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret
  })
  const {
    symbol, price, amount, type, affiliateCode, onlySubmitOrder, skipConfirm,
    priceStop, distance
  } = {
    // needed in order to pipe data to the process, until we can figure out a
    // workaround
    skipConfirm: false,
    onlySubmitOrder: false, // allows this script to be used only for submits
    symbol: 'tLEOUSD',
    price: 2,
    amount: -6,
    type: Order.type.LIMIT,
    affiliateCode: 'xZvWHMNR'
  }

  const o = new Order({
    cid: Date.now(),
    symbol,
    price,
    priceAuxLimit: priceStop,
    priceTrailing: distance,
    amount,
    type,
    affiliateCode
  }, rest)

  if (!skipConfirm) {
    const confirm = await readline.questionAsync([
      '>  Are you sure you want to submit this order?',
      `>  ${o.toString()}`,
      '>  '
    ].join('\n'))

    if (confirm.toLowerCase()[0] !== 'y') {
      readline.close()
      return
    }
  }

  debug('submitting order: %s', o.toString())

  await o.submit()

  debug('order successfully submitted! (id %j, cid %j, gid %j)', o.id, o.cid, o.gid)

  if (onlySubmitOrder) {
    readline.close()
    return // for bfx-cli
  }

  debug('')
  debug('will update price to $3.00 in %fs...', UPDATE_DELAY_MS / 1000)

  await new Promise(resolve => setTimeout(resolve, UPDATE_DELAY_MS))

  debug('')
  debug('updating order price...')

  const updateNotification = await o.update({ price: 3 })
  debug('successfully updated! (%s: %s)', updateNotification.status, updateNotification.text)
  debug('')
  debug('will cancel the order in %fs', CANCEL_DELAY_MS / 1000)

  await new Promise(resolve => setTimeout(resolve, CANCEL_DELAY_MS))

  debug('')
  debug('cancelling order...')

  const cancelNotification = await o.cancel()
  debug('successfully canceled! (%s: %s)', cancelNotification.status, cancelNotification.text)
  readline.close()
}

execute()
