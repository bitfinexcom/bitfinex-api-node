'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  userPL: 0,
  userSwaps: 1,
  symbol: 2,
  tradeableBalance: 3,
  marginBalance: 4,
  marginNet: 5
}

const FIELD_KEYS = Object.keys(FIELDS)

class MarginInfo extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = MarginInfo
