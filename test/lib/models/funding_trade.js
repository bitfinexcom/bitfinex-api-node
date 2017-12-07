/* eslint-env mocha */
'use strict'

const assert = require('assert')
const { FundingTrade } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('FundingTrade model', () => {
  testModel({
    model: FundingTrade,
    orderedFields: [
      'id', 'symbol', 'mtsCreate', 'offerID', 'amount', 'rate', 'period',
      'maker'
    ]
  })
})
