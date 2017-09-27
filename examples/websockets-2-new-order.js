'use strict'

const BFX = require('../')
// const BFX = require('bitfinex-api-node')

const API_KEY = ''
const API_SECRET = ''

const opts = { version: 2, transform: false, autoOpen: false }
const bws = new BFX(API_KEY, API_SECRET, opts).ws

bws.open()

bws.on('open', () => {
  bws.auth()
})

// unique client order id,
// has to be unique for the current day
const cId = Date.now()

bws.on('auth', () => {
  console.log('authenticated')

  setTimeout(() => {
    submitOrder(cId)
  }, 5000)
})

function submitOrder () {
  const payload = [
    0,
    'on',
    null,
    {
      'gid': 1,
      'cid': cId, // unique client order id
      'type': 'LIMIT',
      'symbol': 'tBTCUSD',
      'amount': '1.0',
      'price': '200',
      'hidden': 0
    }
  ]

  bws.send(payload)
}

function cancelOrder (oId) {
  // https://docs.bitfinex.com/v2/reference#ws-input-order-cancel

  const payload = [
    0,
    'oc',
    null,
    {
      'id': oId

    }
  ]

  bws.send(payload)
}

bws.on('message', (msg) => {
  console.log('----message-begin----')
  console.log(msg)
  console.log('-----message-end-----')

  if (!Array.isArray(msg)) return

  const [ , type, payload ] = msg

  if (type === 'ou') { // order update
    if (payload[2] === cId) {
      const oId = payload[0]
      console.log('cancelling order...')
      cancelOrder(oId)
    }
  }
})

bws.on('error', (error) => {
  console.error('error:')
  console.error(error)
})
