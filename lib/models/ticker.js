'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  bid: 0,
  bidSize: 1,
  ask: 2,
  askSize: 3,
  dailyChange: 4,
  dailyChangePerc: 5,
  lastPrice: 6,
  volume: 7,
  high: 8,
  low: 9
}

const FIELD_KEYS = Object.keys(FIELDS)

class Ticker extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = Ticker
