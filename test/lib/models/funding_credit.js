/* eslint-env mocha */
'use strict'

const { FundingCredit } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('FundingCredit model', () => {
  testModel({
    model: FundingCredit,
    boolFields: ['notify', 'hidden', 'renew', 'noClose'],
    orderedFields: [
      'id', 'symbol', 'side', 'mtsCreate', 'mtsUpdate', 'amount', 'flags',
      'status', null, null, null, 'rate', 'period', 'mtsOpening',
      'mtsLastPayout', 'notify', 'hidden', null, 'renew', 'rateReal', 'noClose',
      'positionPair'
    ]
  })
})
