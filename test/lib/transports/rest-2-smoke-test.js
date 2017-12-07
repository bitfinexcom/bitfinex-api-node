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

const testResBody = `[1765.3,
  0.56800816,
  1767.6,
  1.3874,
  -62.2,
  -0.034,
  1765.3,
  14063.54589155,
  1834.2,
  1726.3 ]`

describe('rest2 api client', () => {
  it('gets a response as JSON', (done) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      })
      res.end(testResBody)
    })

    server.listen(PORT, () => {
      bhttp.ticker('tBTCUSD', (err, res) => {
        assert.equal(err, null)
        assert.deepEqual(
          res,
          JSON.parse(testResBody)
        )

        server.close()
        done()
      })
    })
  })
})
