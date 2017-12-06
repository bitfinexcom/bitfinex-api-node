'use strict'

const Model = require('../model')

// TODO: documentation isn't clear, check it on the wire
class FundingInfo extends Model {
  serialize () {
    throw new Error('unimplemented')
  }

  static unserialize (arr) {
    throw new Error('unimplemented')
  }
}

module.exports = FundingInfo
