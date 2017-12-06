'use strict'

const Model = require('../model')

class MarginInfo extends Model {
  serialize () {
    return [
      this.userPL,
      this.userSwaps,
      this.symbol,
      this.tradeableBalance,
      this.marginBalance,
      this.marginNet
    ]
  }

  static unserialize (arr) {
    return {
      userPL: arr[0],
      userSwaps: arr[1],
      symbol: arr[2],
      tradeableBalance: arr[3],
      marginBalance: arr[4],
      marginNet: arr[5]
    }
  }
}

module.exports = MarginInfo
