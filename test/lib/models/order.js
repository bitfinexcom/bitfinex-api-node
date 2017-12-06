'use strict'

const assert = require('assert')
const { Order } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Order model', () => {
  testModel({
    model: Order,
    boolFields: ['notify', 'hidden'],
    orderedFields: [
      'id', 'gid', 'cid', 'symbol', 'mtsCreate', 'mtsUpdate', 'amount',
      'amountOrig', 'type', 'typePrev', null, null, 'flags', 'status', null,
      null, 'price', 'priceAvg', 'priceTrailing', 'priceAuxLimit', null, null,
      null, 'notify', 'hidden', 'placedId'
    ]
  })
})
