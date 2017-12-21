/* eslint-env mocha */
'use strict'

const { TradeTick } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Trade Tick model', () => {
  testModel({
    model: Trade,
    boolFields: ['maker'],
    orderedFields: [
      'id', 'mts', 'amount', 'price'
    ]
  })
})
