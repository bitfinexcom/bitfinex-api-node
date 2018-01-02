'use strict'

const Model = require('../model')

class Alert extends Model {
  serialize () {
    return [
      this.key,
      this.type,
      this.symbol,
      this.price
    ]
  }

  static unserialize (arr) {
    return {
      key: arr[0],
      type: arr[1],
      symbol: arr[2],
      price: arr[3]
    }
  }
}

module.exports = Alert
