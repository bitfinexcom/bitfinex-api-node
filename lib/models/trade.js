'use strict'

const Model = require('../model')

class Trade extends Model {
  serialize () {
    return [
      this.id,
      this.pair,
      this.mtsCreate,
      this.orderID,
      this.execAmount,
      this.execPrice,
      this.orderType,
      this.orderPrice,
      this.maker ? 1 : 0,
      this.fee,
      this.feeCurrency
    ]
  }

  static unserialize (arr) {
    return {
      id: arr[0],
      pair: arr[1],
      mtsCreate: arr[2],
      orderID: arr[3],
      execAmount: arr[4],
      execPrice: arr[5],
      orderType: arr[6],
      orderPrice: arr[7],
      maker: arr[8] === 1,
      fee: arr[9],
      feeCurrency: arr[10]
    }
  }
}

module.exports = Trade
