'use strict'

const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    manageCandles: true, // enable candle dataset persistence/management
    transform: true // converts ws data arrays to Candle models (and others)
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  const market = 'tBTCUSD'
  const tf = '5m'
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
}

execute()
