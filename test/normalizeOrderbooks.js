/* eslint-env mocha */

const assert = require('assert')

const normalizeBooks = require('../lib/normalizeOrderbooks.js')

const stubResponseR0 = require('./fixtures/response-ws2-server-order-book-R0.json')
const stubResponseP1 = require('./fixtures/response-ws2-server-order-book-P1.json')
const r0Update = [ 1023, [ 2566715351, 1863.5, 2.57902409 ] ]
const p0Update = [ 51, [ 1881.7, 0, -1 ] ]

// fake onMessage data handling
stubResponseR0.shift()
stubResponseP1.shift()
r0Update.shift()
p0Update.shift()

describe('normalize books', () => {
  it('lets snpashots with precisions !== R0 pass through', () => {
    const res = normalizeBooks(stubResponseP1, 'P1')

    assert.deepEqual(res[0][0], [ 1779, 1, 42.11518492 ])
  })

  it('lets updates with precisions !== R0 pass through', () => {
    const res = normalizeBooks(p0Update, 'P1')

    assert.deepEqual(res[0], [ 1881.7, 0, -1 ])
  })

  it('normalizes orderbooks with R0', () => {
    const res = normalizeBooks(stubResponseR0, 'R0')
    assert.equal(res[0][0][0], 1876.5)
    assert.equal(res[0][0][1], 2567606289)
    assert.equal(res[0][0][2], 1.4305)
  })


  it('normalizes data updates with R0', () => {
    const res = normalizeBooks(r0Update, 'R0')
    assert.deepEqual(res[0], [ 1863.5, 2566715351, 2.57902409 ])
  })
})
