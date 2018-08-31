'use strict'

const Model = require('../model')

class FundingInfo extends Model {
  serialize () {
    const { symbol, yieldLoan, yieldLend, durationLoan, durationLend } = this

    return [
      'sym',
      symbol,
      [
        yieldLoan,
        yieldLend,
        durationLoan,
        durationLend
      ]
    ]
  }

  static unserialize (arr) {
    const [ , symbol, data = [] ] = arr
    const [ yieldLoan, yieldLend, durationLoan, durationLend ] = data

    return {
      symbol,
      yieldLoan,
      yieldLend,
      durationLoan,
      durationLend
    }
  }
}

module.exports = FundingInfo
