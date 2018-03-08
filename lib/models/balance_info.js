'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  amount: 0,
  amountNet: 1
}

const FIELD_KEYS = Object.keys(FIELDS)

class BalanceInfo extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = BalanceInfo
