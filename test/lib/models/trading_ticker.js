/* eslint-env mocha */
'use strict'

const { TradingTicker } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Trading Ticker model', () => {
  testModel({
    model: TradingTicker,
    values: {
      symbol: 'tBTCUSD'
    },

    orderedFields: [
      'symbol', 'bid', 'bidSize', 'ask', 'askSize', 'dailyChange',
      'dailyChangePerc', 'lastPrice', 'volume', 'high', 'low'
    ]
  })
})
