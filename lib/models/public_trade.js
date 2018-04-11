'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  id: 0,
  mts: 1,
  amount: 2,
  price: 3
}

const FIELD_KEYS = Object.keys(FIELDS)

class PublicTrade extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = PublicTrade
