'use strict'

const assert = require('assert')
const { FundingLoan } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('FundingLoan model', () => {
  testModel({
    model: FundingLoan,
    boolFields: ['notify', 'hidden', 'insure', 'renew', 'noClose'],
    orderedFields: [
      'id', 'symbol', 'side', 'mtsCreate', 'mtsUpdate', 'amount', 'flags',
      'status', 'rate', 'period', 'mtsOpening', 'mtsLastPayout', 'notify',
      'hidden', 'insure', 'renew', 'rateReal', 'noClose'
    ]
  })
})
