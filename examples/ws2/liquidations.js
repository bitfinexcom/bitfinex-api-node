'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:examples:liquidations')
const bfx = require('../bfx')
const ws = bfx.ws(2, { transform: true })

ws.on('open', () => {
  debug('open')
  ws.subscribeStatus('liq:global')
})

ws.onStatus({ key: 'liq:global' }, (data) => {
  console.log(data)
})

ws.open()
