'use strict'

const Model = require('../model')
const BOOL_FIELDS = []
const FIELDS = {
  mts: 0,
  type: 1,
  messageID: 2,
  notifyInfo: 3,
  code: 4,
  status: 5,
  text: 6
}

const FIELD_KEYS = Object.keys(FIELDS)

class Notification extends Model {
  constructor (data = {}) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }
}

module.exports = Notification
