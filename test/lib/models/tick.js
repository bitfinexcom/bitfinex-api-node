/* eslint-env mocha */
'use strict'

const { Tick } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Trade Tick model', () => {
  testModel({
    model: Tick,
    values: {
      symbol: 'tBTCUSD'
    },

    orderedFields: [
      'symbol', 'bid', 'bidSize', 'ask', 'askSize', 'dailyChange',
      'dailyChangePerc', 'lastPrice', 'volume', 'high', 'low'
    ]
  })
})

describe('Funding Tick model', () => {
  testModel({
    model: Tick,
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
