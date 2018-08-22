'use strict'

process.env.DEBUG = 'bfx:api:*'

const debug = require('debug')('bfx:api:examples:ws2:candles')
const bfx = require('../legacy_bfx.js')

const ws = bfx.ws(2, {
  manageCandles: true, // enable candle dataset persistence/management
  transform: true // converts ws data arrays to Candle models (and others)
})

const CANDLE_KEY = 'trade:1m:tBTCUSD'

ws.on('open', () => {
  debug('open')
  ws.subscribeCandles(CANDLE_KEY)
})

let prevTS = null

// 'candles' here is an array
ws.onCandle({ key: CANDLE_KEY }, (candles) => {
  if (prevTS === null || candles[0].mts > prevTS) {
    const c = candles[1] // report previous candle

    debug(`%s %s open: %f, high: %f, low: %f, close: %f, volume: %f`,
      CANDLE_KEY, new Date(c.mts).toLocaleTimeString(),
      c.open, c.high, c.low, c.close, c.volume
    )

    prevTS = candles[0].mts
  }
})

ws.open()
