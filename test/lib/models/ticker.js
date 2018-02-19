/* eslint-env mocha */
'use strict'

const { Ticker } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Ticker model', () => {
  testModel({
    model: Ticker,
    values: {
      symbol: 'tBTCUSD'
    },

    orderedFields: [
      'symbol', 'bid', 'bidSize', 'ask', 'askSize', 'dailyChange',
      'dailyChangePerc', 'lastPrice', 'volume', 'high', 'low'
    ]
  })
})
