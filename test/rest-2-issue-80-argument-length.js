/* eslint-env mocha */

'use strict'

const PORT = 1337

const assert = require('assert')
const http = require('http')

const API_KEY = 'dummy'
const API_SECRET = 'dummy'

const REST2 = require('../rest2.js')

const bhttp = new REST2(API_KEY, API_SECRET)
bhttp.url = `http://localhost:${PORT}`

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
      bhttp.genericCallback = (err) => {
        assert.ok(err)

        server.close()
        done()
      }

      bhttp.makeAuthRequest('/auth/r/orders', () => {})
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
      bhttp.makeAuthRequest('/auth/r/orders', {}, (err, res) => {
        assert.equal(err, null)
        assert.deepEqual(
          res,
          [ 'ente', 'gans', 'scholle' ]
        )

        server.close()
        done()
      })
    })
  })
})
