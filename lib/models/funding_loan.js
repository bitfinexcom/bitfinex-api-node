'use strict'

const Model = require('../model')
const BOOL_FIELDS = ['notify', 'hidden', 'insure', 'renew', 'noClose']
const FIELDS = {
  id: 0,
  symbol: 1,
  side: 2,
  mtsCreate: 3,
  mtsUpdate: 4,
  amount: 5,
  flags: 6,
  status: 7,
  rate: 8,
  period: 9,
  mtsOpening: 10,
  mtsLastPayout: 11,
  notify: 12,
  hidden: 13,
  insure: 14,
  renew: 15,
  rateReal: 16,
  noClose: 17
}

const FIELD_KEYS = Object.keys(FIELDS)

class FundingLoan extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

FundingLoan.status = {}
FundingLoan.side = { // TODO: enquire about case sensitivity
  LEND: 'Lend',
  LOAN: 'Loan'
}

const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELED']
statuses.forEach((s) => {
  FundingLoan.status[s.split(' ').join('_')] = s
})

module.exports = FundingLoan
