'use strict'

const Model = require('../model')
const BOOL_FIELDS = ['notify', 'hidden', 'insure', 'renew']
const FIELDS = {
  id: 0,
  symbol: 1,
  mtsCreate: 2,
  mtsUpdate: 3,
  amount: 4,
  amountOrig: 5,
  type: 6,
  flags: 7,
  status: 8,
  rate: 9,
  period: 10,
  notify: 11,
  hidden: 12,
  insure: 13,
  renew: 14,
  rateReal: 15
}

const FIELD_KEYS = Object.keys(FIELDS)

class FundingOffer extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

FundingOffer.status = {}
FundingOffer.type = { // TODO: enquire about case sensitivity
  LEND: 'lend',
  LOAN: 'loan'
}

const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELLED']
statuses.forEach((s) => {
  FundingOffer.status[s.split(' ').join('_')] = s
})

module.exports = FundingOffer
