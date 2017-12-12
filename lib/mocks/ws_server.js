'use strict'

const WebSocket = require('ws')
const { EventEmitter } = require('events')

class MockWSServer extends EventEmitter {
  constructor (port = 1337, version = 2) {
    super()

    this._wss = new WebSocket.Server({
      perMessageDeflate: false,
      port
    })

    this._version = version
    this._clients = []
    this._wss.on('connection', this._onConnection.bind(this))
  }

  close () {
    this._wss.close()
  }

  send (packet) {
    const wsPacket = JSON.stringify(packet)

    this._clients.forEach(c => c.send(wsPacket))
  }

  _onConnection (ws) {
    this._clients.push(ws)

    ws.send(JSON.stringify({
      event: 'info',
      version: this._version
    }))

    ws.on('message', this._onClientMessage.bind(this, ws))
  }

  _onClientMessage (ws, msgJSON) {
    const msg = JSON.parse(msgJSON)

    this.emit('message', ws, msg)

    if (msg.event === 'auth') {
      return this._handleAuthMessage(ws, msg)
    } else if (msg.event === 'subscribe') {
      return this._handleSubscribeMessage(ws, msg)
    } else if (Array.isArray(msg)) {
      if (msg[0] !== 0) return
      if (msg[1] !== 'on') return

      // For order conf requests
      // TODO: Split this up to notify on cancel, fill, etc
      ws.send(JSON.stringify([0, 'n', [
        null,
        'on-req',
        null,
        null, [
          msg[3].gid,
          null,
          msg[3].cid,
          msg[3].symbol,
          null,
          null,
          msg[3].amount,
          msg[3].amount,
          msg[3].type,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          msg[3].price,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          null,
          null
        ],
        null,
        'SUCCESS',
        'Submitting order'
      ]]))
    }
  }

  _handleAuthMessage (ws, msg) {
    ws.send(JSON.stringify({
      event: 'auth',
      status: 'OK',
      chanId: 0,
      userId: 0
    }))
  }

  _handleSubscribeMessage (ws, msg) {
    ws.send(JSON.stringify({
      event: 'subscribed',
      channel: msg.channel,
      pair: msg.pair,
      symbol: msg.symbol,
      key: msg.key,
      chanId: Math.floor(Math.random() * 10000),
      userId: 0
    }))
  }
}

module.exports = MockWSServer
