/* eslint-env mocha */
'use strict'

const { FundingTicker } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Funding Ticker model', () => {
  testModel({
    model: FundingTicker,
    values: {
      symbol: 'fUSD'
    },

    orderedFields: [
      'symbol', 'frr', 'bid', 'bidSize', 'bidPeriod', 'ask', 'askSize',
      'askPeriod', 'dailyChange', 'dailyChangePerc', 'lastPrice', 'volume',
      'high', 'low'
    ]
  })
})
