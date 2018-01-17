/* eslint-env mocha */
'use strict'

const { TradeTicker } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Trade Ticker model', () => {
  testModel({
    model: TradeTicker,
    values: {
      symbol: 'tBTCUSD'
    },

    orderedFields: [
      'symbol', 'bid', 'bidSize', 'ask', 'askSize', 'dailyChange',
      'dailyChangePerc', 'lastPrice', 'volume', 'high', 'low'
    ]
  })
})
