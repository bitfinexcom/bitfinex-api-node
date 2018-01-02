/* eslint-env mocha */
'use strict'

const { Position } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Position model', () => {
  testModel({
    model: Position,
    orderedFields: [
      'symbol', 'status', 'amount', 'basePrice', 'marginFunding',
      'marginFundingType', 'pl', 'plPerc', 'liquidationPrice', 'leverage'
    ]
  })
})
