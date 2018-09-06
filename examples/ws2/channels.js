'use strict'

process.env.DEBUG = 'bfx:examples:*'

const _flatten = require('lodash/flatten')
const debug = require('debug')('bfx:examples:channels')
const { Manager, subscribe } = require('bfx-api-node-core')
const { RESTv2 } = require('bfx-api-node-rest')
const managerArgs = require('../manager_args')

const mgr = new Manager({ ...managerArgs })
const rest = new RESTv2()

debug('fetching symbol details...')

rest.symbolDetails().then(details => {
  const symbols = details.map(d => `t${d.pair.toUpperCase()}`)
  const timeFrames = ['1m', '5m', '30m', '1h', '6h']
  const keys = _flatten(symbols.map(s => {
    return timeFrames.map(tf => `trade:${tf}:${s}`)
  }))

  mgr.onceWS('open', {}, (state = {}) => {
    debug('open')
    debug('subscribing to %d channels', keys.length)

    let nextState = state

    keys.forEach(key => {
      nextState = subscribe(nextState, 'candles', { key })
    })

    return nextState
  })

  keys.forEach(key => {
    mgr.onWS('candles', { key }, (candles) => {
      debug('recv %d candles on channel %s', candles.length, key)
    })
  })

  debug('opening socket...')

  mgr.openWS()
})
