'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  symbol: 0,
  frr: 1,
  bid: 2,
  bidSize: 3,
  bidPeriod: 4,
  ask: 5,
  askSize: 6,
  askPeriod: 7,
  dailyChange: 8,
  dailyChangePerc: 9,
  lastPrice: 10,
  volume: 11,
  high: 12,
  low: 13
}

const FIELD_KEYS = Object.keys(FIELDS)

class FundingTicker extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = FundingTicker
