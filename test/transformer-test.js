/* eslint-env mocha */

const assert = require('assert')
const _clone = require('lodash/clone')

const transformer = require('../lib/transformer.js')

const stubResponseTickerFunding = require('./fixtures/response-ticker-funding.json')
const stubResponseTickerPairs = require('./fixtures/response-ticker-pairs.json')

const stubResponseOrderbooksP1 = _clone(require('./fixtures/response-ws2-server-order-book-P1.json'))
stubResponseOrderbooksP1.shift()

describe('transformer', () => {
  it('transforms pairs', () => {
    const res = transformer(stubResponseTickerPairs, 'ticker', 'tBTCUSD')

    assert.deepEqual(
      res,
      { BID: 1781.8,
        BID_SIZE: 3.10227283,
        ASK: 1781.9,
        ASK_SIZE: 1.44527318,
        DAILY_CHANGE: -35.7,
        DAILY_CHANGE_PERC: -0.0196,
        LAST_PRICE: 1781.8,
        VOLUME: 13402.66689773,
        HIGH: 1834.2,
        LOW: 1726.3
      }
    )
  })

  it('transforms funding currencies', () => {
    const res = transformer(stubResponseTickerFunding, 'ticker', 'fUSD')
    assert.deepEqual(
      res,
      { FRR: 0.0009239,
        BID: 0.00071,
        BID_SIZE: 30,
        BID_PERIOD: 5000,
        ASK: 0.0009239,
        ASK_SIZE: 2,
        ASK_PERIOD: 44568.06495174,
        DAILY_CHANGE: 0.00044901,
        DAILY_CHANGE_PERC: 0.3207,
        LAST_PRICE: 0.001849,
        VOLUME: 14032554.7966796,
        HIGH: 0,
        LOW: 0
      }
    )
  })

  it('handles tu / te trade events', () => {
    const input = [ 'te', [ 32471347, 1495120864000, 0.08064796, 1929.5 ] ]

    assert.deepEqual(
      transformer(input, 'trades', 'tBTCUSD'),
      [
        'te',
        {
          ID: 32471347,
          MTS: 1495120864000,
          AMOUNT: 0.08064796,
          PRICE: 1929.5
        }
      ]
    )
  })

  it('transforms snapshots for orderbooks', () => {
    const res = transformer(stubResponseOrderbooksP1[0], 'orderbook', 'tBTCUSD')
    assert.deepEqual(
      res[0],
      { PRICE: 1779, COUNT: 1, AMOUNT: 42.11518492 }
    )
  })

  it('normalizes names for the rest2 client', () => {
    assert.deepEqual(
      transformer.normalize('ticker/tBTCUSD'),
      { symbol: 'tBTCUSD', type: 'ticker' }
    )
  })

  it('normalize doesnt throw if called undefined value', () => {
    transformer.normalize(undefined)
  })

  it('normalize gets subtype for trading pair', () => {
    const subtype = transformer.getSubtype('tBTCUSD')
    assert.equal(subtype, 'tradingPairs')
  })

  it('normalize gets subtype for funding currency', () => {
    const subtype = transformer.getSubtype('fUSD')
    assert.equal(subtype, 'fundingCurrencies')
  })
})
