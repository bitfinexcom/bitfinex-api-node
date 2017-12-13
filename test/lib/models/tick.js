/* eslint-env mocha */
'use strict'

const { Tick } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Tick model', () => {
  testModel({
    model: Tick,
    orderedFields: [
      'symbol', 'frr', 'bid', 'bidPeriod', 'bidSize', 'ask', 'askPeriod',
      'askSize', 'dailyChange', 'dailyChangePerc', 'lastPrice', 'volume',
      'high', 'low'
    ]
  })
})
