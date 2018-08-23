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
    transform: true,
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

    setTimeout(() => {
      debug('num keys: %d', keys.length)
      debug('num sockets: %d', m.getNumSockets())
      debug('socket info: %j', m.getSocketInfo())
    }, 6000)
  })

  m.openSocket()
})
