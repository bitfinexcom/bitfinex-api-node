'use strict'

const WebSocket = require('ws')

const PORT = 1337
const spawnWSServer = (port = PORT, version = 2) => {
  const wss = new WebSocket.Server({
    perMessageDeflate: false,
    port
  })

  const clients = []

  wss.send = (packet) => {
    clients.forEach(c => c.send(JSON.stringify(packet)))
  }

  wss.on('connection', (ws) => {
    clients.push(ws)

    ws.send(JSON.stringify({
      event: 'info',
      version
    }))

    ws.on('message', (msgJSON) => {
      const msg = JSON.parse(msgJSON)

      if (msg.event === 'auth') {
        ws.send(JSON.stringify({
          event: 'auth',
          status: 'OK',
          chanId: 0,
          userId: 0,
        }))
      } else if (msg.constructor.name === 'Array') {
        if (msg[0] !== 0) return
        if (msg[1] !== 'on') return

        ws.send(JSON.stringify([0, 'n', [
          null,
          'on-req',
          null,
          null, [
            msg[3].gid,
            null,
            msg[3].cid,
            msg[3].symol,
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
    })
  })

  return wss
}

spawnWSServer.port = PORT

module.exports = spawnWSServer
