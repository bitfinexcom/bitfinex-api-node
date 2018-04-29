'use strict'

const Model = require('../model')
const BOOL_FIELDS = ['notify', 'hidden', 'renew', 'noClose']
const FIELDS = {
  id: 0,
  symbol: 1,
  side: 2,
  mtsCreate: 3,
  mtsUpdate: 4,
  amount: 5,
  flags: 6,
  status: 7,
  rate: 11,
  period: 12,
  mtsOpening: 13,
  mtsLastPayout: 14,
  notify: 15,
  hidden: 16,
  renew: 18,
  rateReal: 19,
  noClose: 20,
  positionPair: 21
}

const FIELD_KEYS = Object.keys(FIELDS)

class FundingCredit extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

FundingCredit.status = {}
const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELED']
statuses.forEach((s) => {
  FundingCredit.status[s.split(' ').join('_')] = s
})

module.exports = FundingCredit
