/* eslint-env mocha */

'use strict'

const assert = require('assert')

const WSv2 = require('../../../lib/transports/ws2')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const createTestWSv2Instance = (params = {}) => {
  return new WSv2({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    url: 'ws://localhost:9997',
    ...params
  })
}

describe('WSv2 channels', () => {
  it('numeric and string channel ids work', () => {
    const ws = createTestWSv2Instance()

    ws._channelMap = {
      83297: {
        event: 'subscribed',
        channel: 'book',
        chanId: 83297,
        symbol: 'tADAUSD',
        prec: 'P0',
        freq: 'F0',
        len: '25',
        pair: 'ADAUSD'
      }
    }

    assert.strictEqual(ws.hasChannel(83297), true)
    assert.strictEqual(ws.hasChannel('83297'), true)
    assert.strictEqual(ws.hasChannel('1337'), false)
    assert.strictEqual(ws.hasChannel(1337), false)
  })
})
