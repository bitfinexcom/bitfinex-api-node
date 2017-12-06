'use strict'

const Model = require('../model')

class Position extends Model {
  serialize () {
    return [
      this.symbol,
      this.status,
      this.amount,
      this.basePrice,
      this.marginFunding,
      this.marginFundingType,
      this.pl,
      this.plPerc,
      this.liquidationPrice,
      this.leverage
    ]
  }

  static unserialize (arr) {
    return {
      symbol: arr[0],
      status: arr[1],
      amount: arr[2],
      basePrice: arr[3],
      marginFunding: arr[4],
      marginFundingType: arr[5],
      pl: arr[6],
      plPerc: arr[7],
      liquidationPrice: arr[8],
      leverage: arr[9]
    }
  }
}

Position.status = {}
const statuses = ['ACTIVE', 'CLOSED']
statuses.forEach(s => Position.status[s] = s)

module.exports = Position
