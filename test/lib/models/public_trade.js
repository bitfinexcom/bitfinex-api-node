/* eslint-env mocha */
'use strict'

const { PublicTrade } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Public Trade model', () => {
  testModel({
    model: PublicTrade,
    orderedFields: [
      'id', 'mts', 'amount', 'price'
    ]
  })
})
