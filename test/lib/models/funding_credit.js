/* eslint-env mocha */
'use strict'

const { FundingCredit } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('FundingCredit model', () => {
  testModel({
    model: FundingCredit,
    boolFields: ['notify', 'hidden', 'insure', 'renew', 'noClose'],
    orderedFields: [
      'id', 'symbol', 'side', 'mtsCreate', 'mtsUpdate', 'amount', 'flags',
      'status', 'rate', 'period', 'mtsOpening', 'mtsLastPayout', 'notify',
      'hidden', 'insure', 'renew', 'rateReal', 'noClose', 'positionPair'
    ]
  })
})
