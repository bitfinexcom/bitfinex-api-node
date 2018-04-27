/* eslint-env mocha */
'use strict'

const { FundingOffer } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('FundingOffer model', () => {
  testModel({
    model: FundingOffer,
    boolFields: ['notify', 'hidden', 'renew'],
    orderedFields: [
      'id', 'symbol', 'mtsCreate', 'mtsUpdate', 'amount', 'amountOrig', 'type',
      null, null, 'flags', 'status', null, null, null, 'rate', 'period',
      'notify', 'hidden', null, 'renew', 'rateReal'
    ]
  })
})
