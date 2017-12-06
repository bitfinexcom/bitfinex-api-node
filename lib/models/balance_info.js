'use strict'

const Model = require('../model')

class BalanceInfo extends Model {
  serialize () {
    return [
      this.amount,
      this.amountNet
    ]
  }

  static unserialize (arr) {
    return {
      amount: arr[0],
      amountNet: arr[1]
    }
  }
}

module.exports = BalanceInfo
