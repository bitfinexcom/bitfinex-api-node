'use strict'

// const BFX = require('bitfinex-api-node')

const BFX = require('../')

const API_KEY = 'secret'
const API_SECRET = 'secret'
const opts = { version: 2, transform: true }
const bws = new BFX(API_KEY, API_SECRET, opts).ws

// ES 6 Map would be also possible
const orderbook = {
  bid: {},
  ask: {}
}

function start () {
  bws.on('open', () => {
    bws.subscribeOrderBook()
  })

  bws.on('orderbook', (pair, rec) => {
    updateOrderbook(orderbook, rec, pair)
  })
}

function isSnapshot (data) {
  return Array.isArray(data)
}

// Trading: if AMOUNT > 0 then bid else ask;
// Funding: if AMOUNT < 0 then bid else ask;
function bidOrAsk (el, type = 't') {
  if (type === 't' && el.AMOUNT > 0) { return 'bid' }
  if (type === 't' && el.AMOUNT < 0) { return 'ask' }

  if (type === 'f' && el.AMOUNT > 0) { return 'ask' }
  if (type === 'f' && el.AMOUNT < 0) { return 'bid' }

  throw new Error('unknown type')
}

function getType (pair) {
  return pair[0]
}

function updateOrderbook (orderbook, rec, pair) {
  const type = getType(pair)

  let updatedBook
  if (isSnapshot(rec)) {
    updatedBook = rec.reduce((acc, el) => {
      const branch = bidOrAsk(el, type)
      orderbook[branch][el.PRICE] = el
      return orderbook
    }, orderbook)

    return
  }

  updatedBook = updateBookEntry(orderbook, rec)
  const prices = sortPrices(updatedBook)
  const spread = prices.bid[0] - prices.ask[0]

  console.log(updatedBook)
  console.log(
    'Bid: ', prices.bid[0], 'Ask:', prices.ask[0], 'Spread', spread
  )
}

function updateBookEntry (orderbook, rec) {
  const { COUNT, AMOUNT, PRICE } = rec
  // when count = 0 then you have to delete the price level.
  if (COUNT === 0) {
    // if amount = 1 then remove from bids
    if (AMOUNT === 1) {
      delete orderbook.bid[PRICE]
      return orderbook
    } else if (AMOUNT === -1) {
      // if amount = -1 then remove from asks
      delete orderbook.ask[PRICE]
      return orderbook
    }

    console.error('[ERROR] amount not found', rec)
    return orderbook
  }

  // when count > 0 then you have to add or update the price level
  if (COUNT > 0) {
    // 3.1 if amount > 0 then add/update bids
    if (AMOUNT > 0) {
      orderbook.bid[PRICE] = rec
      return orderbook
    } else if (AMOUNT < 0) {
      // 3.2 if amount < 0 then add/update asks
      orderbook.ask[PRICE] = rec
      return orderbook
    }

    console.error('[ERROR] side not found', rec)
    return orderbook
  }
}

function sortPrices (book) {
  const res = {}
  res.bid = Object.keys(book.bid).sort((a, b) => {
    return +a >= +b ? -1 : 1
  })
  res.ask = Object.keys(book.ask).sort((a, b) => {
    return +a <= +b ? -1 : 1
  })

  return res
}

// eslint-disable-next-line no-unused-vars
function testUpdateBookEntry () {
  const assert = require('assert')

  const book = {
    bid: {
      '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
      '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
      '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
    },

    ask: {
      '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
      '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
      '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
    }
  }

  const clone = (o) => { return JSON.parse(JSON.stringify(o)) }

  let cBook, res
  // deletes bids
  cBook = clone(book)
  res = updateBookEntry(cBook, { PRICE: 1970.5, COUNT: 0, AMOUNT: 1 })

  assert.deepEqual(
    res,
    {
      bid: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      },

      ask: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      }
    }
  )

  // deletes asks
  cBook = clone(book)
  res = updateBookEntry(cBook, { PRICE: 1970.5, COUNT: 0, AMOUNT: -1 })
  assert.deepEqual(
    res,
    {
      bid: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      },

      ask: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      }
    }
  )

  // updates bids
  cBook = clone(book)
  res = updateBookEntry(cBook, { PRICE: 1970.5, COUNT: 1, AMOUNT: 0.48 })
  assert.deepEqual(
    res,
    {
      bid: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 0.48 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      },

      ask: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      }
    }
  )

  // deletes asks
  cBook = clone(book)
  res = updateBookEntry(cBook, { PRICE: 1970.5, COUNT: 1, AMOUNT: -1 })

  assert.deepEqual(
    res,
    {
      bid: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      },

      ask: {
        '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
        '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: -1 },
        '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
      }
    }
  )
}

// eslint-disable-next-line no-unused-vars
function testSortPrices () {
  const assert = require('assert')

  const book = {
    bid: {
      '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
      '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
      '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
    },

    ask: {
      '1968.8': { PRICE: 1968.8, COUNT: 1, AMOUNT: 0.1 },
      '1970.5': { PRICE: 1970.5, COUNT: 1, AMOUNT: 2 },
      '1970.7': { PRICE: 1970.7, COUNT: 1, AMOUNT: 2 }
    }
  }

  const expected = {
    // ASC
    bid: [
      1970.7,
      1970.5,
      1968.8
    ],
    // DESC
    ask: [
      1968.8,
      1970.5,
      1970.7
    ]
  }

  const res = sortPrices(book)

  assert.deepEqual(res, expected)
}

// testSortPrices()
// testUpdateBookEntry()
start()
