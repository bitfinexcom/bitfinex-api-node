'use strict'

const blessed = require('blessed')
const _isEmpty = require('lodash/isEmpty')
const _reverse = require('lodash/reverse')
const { preparePrice, prepareAmount } = require('bfx-api-node-util')
const { debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    transform: true,
    manageOrderBooks: true // tell the ws client to maintain full sorted OBs
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  const market = 'tBTCUSD'

  if (_isEmpty(market)) {
    throw new Error('market required')
  }

  const screen = blessed.screen()
  const bookTable = blessed.table({
    parent: screen,
    label: `Order Book ${market}`,
    border: 'line',
    style: {
      fg: 'white',
      border: { fg: 'green' }
    }
  })

  ws.onOrderBook({ symbol: market }, (ob) => {
    const data = []

    _reverse(ob.asks).forEach(row => data.push([
      preparePrice(row[0]), prepareAmount(row[2]), String(row[1])
    ]))

    ob.bids.forEach(row => data.push([
      preparePrice(row[0]), prepareAmount(row[2]), String(row[1])
    ]))

    bookTable.setData([['Price', 'Amount', 'Count'], ...data])

    screen.render()
  })

  await ws.subscribeOrderBook(market, 'P0', '25')
}

execute()
