/* eslint-env mocha */
'use strict'

const { UserInfo } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Wallet model', () => {
  testModel({
    model: UserInfo,
    orderedFields: [
      'id', 'email', 'username'
    ]
  })
})
