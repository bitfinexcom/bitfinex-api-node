'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  id: 0,
  currency: 1,
  mts: 3,
  amount: 5,
  balance: 6,
  description: 8
}

const FIELD_KEYS = Object.keys(FIELDS)

class LedgerEntry extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)

    const spl = (this.description || '').split('wallet')

    this.wallet = (spl && spl[1]) ? spl[1].trim() : null
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = LedgerEntry
