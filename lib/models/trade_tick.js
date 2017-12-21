'use strict'

const Model = require('../model')

class TradeTick extends Model {
  serialize () {
    return [
      this.id,
      this.mts,
      this.amount,
      this.price
    ]
  }

  static unserialize (arr) {
    if (Array.isArray(arr[0])) {
      return arr.map(trade => TradeTick.unserialize(trade))
    }

    return {
      id: arr[0],
      mts: arr[1],
      amount: arr[2],
      price: arr[3],
    }
  }
}

module.exports = TradeTick
