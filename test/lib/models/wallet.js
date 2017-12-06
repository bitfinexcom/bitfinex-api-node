'use strict'

const assert = require('assert')
const { Wallet } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Wallet model', () => {
  testModel({
    model: Wallet,
    orderedFields: [
      'type', 'currency', 'balance', 'unsettledInterest', 'balanceAvailable'
    ]
  })
})
