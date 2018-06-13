/* eslint-env mocha */
'use strict'

const { LedgerEntry } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Ledger entry model', () => {
  testModel({
    model: LedgerEntry,
    orderedFields: [
      'id', 'currency', null, 'mts', null, 'amount', 'balance', null,
      'description'
    ]
  })
})
