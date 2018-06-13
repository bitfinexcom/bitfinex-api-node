/* eslint-env mocha */
'use strict'

const { Movement } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Movement model', () => {
  testModel({
    model: Movement,
    orderedFields: [
      'id', 'currency', 'currencyName', null, null, 'mtsStarted', 'mtsUpdated',
      null, null, 'status', null, null, 'amount', 'fees', null, null,
      'destinationAddress', null, null, null, 'transactionId'
    ]
  })
})
