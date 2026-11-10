'use strict'

const test = require('brittle')

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

test('WSv2 channels', async (t) => {
  await t.test('numeric and string channel ids work', (t) => {
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

    t.is(ws.hasChannel(83297), true)
    t.is(ws.hasChannel('83297'), true)
    t.is(ws.hasChannel('1337'), false)
    t.is(ws.hasChannel(1337), false)
  })
})
