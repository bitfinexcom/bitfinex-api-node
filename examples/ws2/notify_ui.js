'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:examples:notify_ui')
const bfx = require('../bfx')
const ws = bfx.ws(2)

ws.on('error', (err) => {
  console.log(err)
})

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.once('auth', () => {
  debug('authenticated')

  ws.notifyUI({
    type: 'success',
    message: 'This is a test notification sent via the WSv2 API'
  })

  debug('notification sent')

  ws.close()
})

ws.open()
