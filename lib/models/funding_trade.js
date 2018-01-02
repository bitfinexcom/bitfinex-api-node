'use strict'

const Model = require('../model')

class FundingTrade extends Model {
  serialize () {
    return [
      this.id,
      this.symbol,
      this.mtsCreate,
      this.offerID,
      this.amount,
      this.rate,
      this.period,
      this.maker // TODO: {0,1} or something else?
    ]
  }

  static unserialize (arr) {
    return {
      id: arr[0],
      symbol: arr[1],
      mtsCreate: arr[2],
      offerID: arr[3],
      amount: arr[4],
      rate: arr[5],
      period: arr[6],
      maker: arr[7]
    }
  }
}

module.exports = FundingTrade
