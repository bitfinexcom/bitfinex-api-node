/* eslint-env mocha */
'use strict'

const PORT = 1337

const assert = require('assert')
const http = require('http')

const REST2 = require('../../../lib/transports/rest2')

const bhttp = new REST2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: `http://localhost:${PORT}`
})

const testResBody = `["ente", "gans", "scholle"]`

describe('rest2 api client: issue 80 - argumment length auth request', () => {
  it('errors if no payload defined', (done) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      })
      res.end(testResBody)
    })

    server.listen(PORT, () => {
      bhttp._makeAuthRequest('/auth/r/orders').then(() => {
        server.close()
        done()
      }).catch(err => {
        server.close()
        done(err)
      })
    })
  })

  it('succeeds with the right argument length', (done) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      })
      res.end(testResBody)
    })

    server.listen(PORT, () => {
      bhttp._makeAuthRequest('/auth/r/orders', {}).then(res => {
        assert.deepEqual(
          res,
          [ 'ente', 'gans', 'scholle' ]
        )

        server.close()
        done()
      }).catch(err => {
        server.close()
        done(err)
      })
    })
  })
})
