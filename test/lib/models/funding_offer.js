'use strict'

const assert = require('assert')
const { FundingOffer } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('FundingOffer model', () => {
  testModel({
    model: FundingOffer,
    boolFields: ['notify', 'hidden', 'insure', 'renew'],
    orderedFields: [
      'id', 'symbol', 'mtsCreate', 'mtsUpdate', 'amount', 'amountOrig', 'type',
      'flags', 'status', 'rate', 'period', 'notify', 'hidden', 'insure',
      'renew', 'rateReal'
    ]
  })
})
