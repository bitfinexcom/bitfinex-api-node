'use strict'

const Model = require('../model')
const BOOL_FIELDS = ['maker']
const FIELDS = {
  id: 0,
  pair: 1,
  mtsCreate: 2,
  orderID: 3,
  execAmount: 4,
  execPrice: 5,
  orderType: 6,
  orderPrice: 7,
  maker: 8,
  fee: 9,
  feeCurrency: 10
}

const FIELD_KEYS = Object.keys(FIELDS)

class Trade extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = Trade
