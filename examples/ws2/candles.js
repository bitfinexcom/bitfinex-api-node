'use strict'

const _isEmpty = require('lodash/isEmpty')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-candles',
  ws: {
    env: true,
    connect: true,
    manageCandles: true, // enable candle dataset persistence/management
    transform: true, // converts ws data arrays to Candle models (and others)
    keepOpen: true
  },
  params: {
    market: 'tBTCUSD',
    tf: '5m'
  }
}, async ({ ws, debug, params }) => {
  const { market, tf } = params

  if (_isEmpty(market)) throw new Error('market required')
  if (_isEmpty(tf)) throw new Error('time frame required')

  const candleKey = `trade:${tf}:${market}`
  let prevTS = null

  ws.onCandle({ key: candleKey }, (candles) => {
    if (candles[0].mts === prevTS) {
      return
    }

    const c = candles[1] // report previous candle

    debug('%s %s open: %f, high: %f, low: %f, close: %f, volume: %f',
      candleKey, new Date(c.mts).toLocaleTimeString(),
      c.open, c.high, c.low, c.close, c.volume
    )

    prevTS = candles[0].mts
  })

  await ws.subscribeCandles(candleKey)
})
