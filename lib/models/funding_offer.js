'use strict'

const Model = require('../model')

class FundingOffer extends Model {
  serialize () {
    return [
      this.id,
      this.symbol,
      this.mtsCreate,
      this.mtsUpdate,
      this.amount,
      this.amountOrig,
      this.type,
      this.flags,
      this.status,
      this.rate,
      this.period,
      this.notify ? 1 : 0,
      this.hidden ? 1 : 0,
      this.insure ? 1 : 0,
      this.renew ? 1 : 0,
      this.rateReal
    ]
  }

  static unserialize (arr) {
    return {
      id: arr[0],
      symbol: arr[1],
      mtsCreate: arr[2],
      mtsUpdate: arr[3],
      amount: arr[4],
      amountOrig: arr[5],
      type: arr[6],
      flags: arr[7],
      status: arr[8],
      rate: arr[9],
      period: arr[10],
      notify: arr[11] === 1,
      hidden: arr[12] === 1,
      insure: arr[13] === 1,
      renew: arr[14] === 1,
      rateReal: arr[15]
    }
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
