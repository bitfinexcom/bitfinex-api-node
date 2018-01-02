'use strict'

const Model = require('../model')

class FundingCredit extends Model {
  serialize () {
    return [
      this.id,
      this.symbol,
      this.side,
      this.mtsCreate,
      this.mtsUpdate,
      this.amount,
      this.flags,
      this.status,
      this.rate,
      this.period,
      this.mtsOpening,
      this.mtsLastPayout,
      this.notify ? 1 : 0,
      this.hidden ? 1 : 0,
      this.insure ? 1 : 0,
      this.renew ? 1 : 0,
      this.rateReal,
      this.noClose ? 1 : 0,
      this.positionPair
    ]
  }

  static unserialize (arr) {
    return {
      id: arr[0],
      symbol: arr[1],
      side: arr[2],
      mtsCreate: arr[3],
      mtsUpdate: arr[4],
      amount: arr[5],
      flags: arr[6],
      status: arr[7],
      rate: arr[8],
      period: arr[9],
      mtsOpening: arr[10],
      mtsLastPayout: arr[11],
      notify: arr[12] === 1,
      hidden: arr[13] === 1,
      insure: arr[14] === 1,
      renew: arr[15] === 1,
      rateReal: arr[16],
      noClose: arr[17] === 1,
      positionPair: arr[18]
    }
  }
}

FundingCredit.status = {}
const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELLED']
statuses.forEach((s) => {
  FundingCredit.status[s.split(' ').join('_')] = s
})

module.exports = FundingCredit
