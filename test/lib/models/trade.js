/* eslint-env mocha */
'use strict'

const { Trade } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Trade model', () => {
  testModel({
    model: Trade,
    boolFields: ['maker'],
    orderedFields: [
      'id', 'pair', 'mtsCreate', 'orderID', 'execAmount', 'execPrice',
      'orderType', 'orderPrice', 'maker', 'fee', 'feeCurrency'
    ]
  })
})
