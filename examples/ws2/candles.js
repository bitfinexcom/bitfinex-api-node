'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_candles')
const bfx = require('../bfx')

const ws = bfx.ws(2, {
  manageCandles: true, // enable candle dataset persistence/management
  transform: true // converts ws data arrays to Candle models (and others)
})

const CANDLE_KEY = 'trade:5m:tBTCUSD'

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
