/* eslint-env mocha */
'use strict'

const { Notification } = require('../../../lib/models')
const testModel = require('../../helpers/test_model')

describe('Notification model', () => {
  testModel({
    model: Notification,
    orderedFields: [
      'mts', 'type', 'messageID', 'notifyInfo', 'code', 'status', 'text'
    ]
  })
})
