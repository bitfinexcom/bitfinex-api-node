'use strict'

const runExample = require('../util/run_example')
const CANDLE_KEY = 'trade:5m:tBTCUSD'

module.exports = runExample({
  name: 'ws2-candles',
  ws: {
    env: true,
    connect: true,
    manageCandles: true, // enable candle dataset persistence/management
    transform: true // converts ws data arrays to Candle models (and others)
  }
}, async ({ ws, debug }) => {
  let prevTS = null
  ws.onCandle({ key: CANDLE_KEY }, (candles) => {
    if (prevTS === null || candles[0].mts > prevTS) {
      const c = candles[1] // report previous candle

      debug('%s %s open: %f, high: %f, low: %f, close: %f, volume: %f',
        CANDLE_KEY, new Date(c.mts).toLocaleTimeString(),
        c.open, c.high, c.low, c.close, c.volume
      )

      prevTS = candles[0].mts
    }
  })

  await ws.subscribeCandles(CANDLE_KEY)
})
