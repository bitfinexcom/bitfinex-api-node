'use strict'

const Model = require('../model')

class Wallet extends Model {
  serialize () {
    return [
      this.type,
      this.currency,
      this.balance,
      this.unsettledInterest,
      this.balanceAvailable
    ]
  }

  static unserialize (arr) {
    return {
      type: arr[0],
      currency: arr[1],
      balance: arr[2],
      unsettledInterest: arr[3],
      balanceAvailable: arr[4]
    }
  }
}

Wallet.type = {}
const types = ['exchange', 'margin', 'funding']
types.forEach(t => Wallet.type[t.toUpperCase()] = t)

module.exports = Wallet
