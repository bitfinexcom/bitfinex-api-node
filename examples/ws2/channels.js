'use strict'

process.env.DEBUG = '*'

const _flatten = require('lodash/flatten')
const debug = require('debug')('bfx:examples:channels')
const bfx = require('../legacy_ws2/bfx')

const ws = bfx.ws(2, { transform: true })
const rest = bfx.rest(2, { transform: true })

debug('fetching symbol details...')

rest.symbolDetails().then(details => {
  const symbols = details.map(d => `t${d.pair.toUpperCase()}`)
  const timeFrames = ['1m', '5m', '30m', '1h', '6h']
  const keys = _flatten(symbols.map(s => {
    return timeFrames.map(tf => `trade:${tf}:${s}`)
  }))

  ws.once('open', () => {
    debug('open')

    keys.forEach(k => {
      ws.subscribeCandles(k)
    })

    /*
    setTimeout(() => {
      ws.unsubscribeCandles(CANDLE_KEY)
    }, 3000)
    */
  })

  keys.forEach(key => {
    ws.onCandle({ key }, (candles) => {
      debug('recv %d candles on channel %s', candles.length, key)

      /*
      candles.forEach(c => {
        debug(`%s %s open: %f, high: %f, low: %f, close: %f, volume: %f`,
          key, new Date(c.mts).toLocaleTimeString(),
          c.open, c.high, c.low, c.close, c.volume
        )
      })
      */
    })
  })

  ws.open()
})
