'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  type: 0,
  currency: 1,
  balance: 2,
  unsettledInterest: 3,
  balanceAvailable: 4
}

const FIELD_KEYS = Object.keys(FIELDS)

class Wallet extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

Wallet.type = {}
const types = ['exchange', 'margin', 'funding']

types.forEach((t) => {
  Wallet.type[t.toUpperCase()] = t
})

module.exports = Wallet
