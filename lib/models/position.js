'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  symbol: 0,
  status: 1,
  amount: 2,
  basePrice: 3,
  marginFunding: 4,
  marginFundingType: 5,
  pl: 6,
  plPerc: 7,
  liquidationPrice: 8,
  leverage: 9
}

const FIELD_KEYS = Object.keys(FIELDS)

class Position extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

Position.status = {}
const statuses = ['ACTIVE', 'CLOSED']
statuses.forEach((s) => {
  Position.status[s] = s
})

module.exports = Position
