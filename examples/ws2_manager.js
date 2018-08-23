'use strict'

process.env.DEBUG = 'bfx:examples:*'

const _flatten = require('lodash/flatten')
const debug = require('debug')('bfx:examples:ws2-manager')
const bfx = require('./bfx')

const Manager = require('../lib/ws2_manager')
const rest = bfx.rest(2, { transform: true })

debug('fetching symbol details...')

rest.symbolDetails().then(details => {
  const symbols = details.map(d => `t${d.pair.toUpperCase()}`)
  const timeFrames = ['1m', '5m', '30m', '1h', '6h']
  const keys = _flatten(symbols.map(s => {
    return timeFrames.map(tf => `trade:${tf}:${s}`)
  }))

  const m = new Manager({
    url: bfx.args.wsURL,
    ...bfx.args
  })

  m.on('error', (err) => {
    debug('error: %s', err)
  })

  m.once('open', () => {
    debug('open')

    keys.forEach(key => {
      m.subscribeCandles(key)
      m.onCandle({ key }, (candles) => {
        debug('recv %d candles on channel %s', candles.length, key)
      })
    })

    symbols.forEach(symbol => {
      m.subscribeTrades(symbol)
      m.onTrades({ symbol }, (trades) => {
        debug('recv %d trades on channel %s', trades.length, symbol)
      })
    })

    symbols.forEach(symbol => {
      m.subscribeTicker(symbol)
      m.onTicker({ symbol }, (ticker) => {
        debug('recv ticker on channel %s: %j', symbol, ticker)
      })
    })

    symbols.forEach(symbol => {
      m.subscribeOrderBook(symbol)
      m.onOrderBook({ symbol }, (update) => {
        debug('recv book update on channel %s: %j', symbol, update)
      })
    })

    setInterval(() => {
      debug('num keys: %d', keys.length)
      debug('num sockets: %d', m.getNumSockets())
      debug('socket info: %j', m.getSocketInfo())
    }, 5000)
  })

  m.openSocket()
})
