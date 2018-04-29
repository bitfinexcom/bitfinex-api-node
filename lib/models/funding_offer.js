'use strict'

const Model = require('../model')
const BOOL_FIELDS = ['notify', 'hidden', 'renew']
const FIELDS = {
  id: 0,
  symbol: 1,
  mtsCreate: 2,
  mtsUpdate: 3,
  amount: 4,
  amountOrig: 5,
  type: 6,
  flags: 9,
  status: 10,
  rate: 14,
  period: 15,
  notify: 16,
  hidden: 17,
  renew: 19,
  rateReal: 20
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

const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELED']
statuses.forEach((s) => {
  FundingOffer.status[s.split(' ').join('_')] = s
})

module.exports = FundingOffer
