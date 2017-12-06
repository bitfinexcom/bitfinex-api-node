/* eslint-env mocha */

'use strict'

const PORT = 1337

const assert = require('assert')
const http = require('http')
const WebSocket = require('ws')

const BFX = require('../index')
const RESTv1 = require('../lib/transports/rest')
const RESTv2 = require('../lib/transports/rest2')
const WSv1 = require('../lib/transports/ws')
const WSv2 = require('../lib/transports/ws2')

describe('BFX', () => {
  it('should be loaded', () => {
    assert.equal(typeof BFX, 'function')
  })

  describe('constructor', () => {
    it('throws on using the deprecated way to set options', () => {
      assert.throws(() => new BFX(2, {}))
      assert.throws(() => new BFX('dummy', 'dummy', 2))
    })
  })

  describe('rest', () => {
    it('throws an error if an invalid version is requested', () => {
      const bfx = new BFX()
      assert.throws(bfx.rest.bind(bfx, 0))
      assert.throws(bfx.rest.bind(bfx, 3))
    })

    it('returns correct REST api by version', () => {
      const bfx = new BFX()
      const restDefault = bfx.rest()
      const rest1 = bfx.rest(1)
      const rest2 = bfx.rest(2)

      assert(restDefault instanceof RESTv2)
      assert(rest1 instanceof RESTv1)
      assert(rest2 instanceof RESTv2)
    })

    it('passes API keys & transform flag to new transport', () => {
      const bfx = new BFX({
        apiKey: 'k',
        apiSecret: 's',
        transform: true,
        restURL: 'http://'
      })

      const rest1 = bfx.rest(1)
      const rest2 = bfx.rest(2)

      assert.equal(rest1._apiKey, 'k')
      assert.equal(rest2._apiKey, 'k')
      assert.equal(rest1._apiSecret, 's')
      assert.equal(rest2._apiSecret, 's')
      assert.equal(rest1._url, 'http://')
      assert.equal(rest2._url, 'http://')
      assert.equal(rest2._transform, true)
    })

    it('passes extra options to new transport', () => {
      const bfx = new BFX()
      const rest2 = bfx.rest(2, { url: '/dev/null' })
      assert.equal(rest2._url, '/dev/null')
    })

    it('returns one instance if called twice for the same version', () => {
      const bfx = new BFX()
      const restA = bfx.rest(2)
      const restB = bfx.rest(2)
      assert(restA === restB)
    })
  })

  describe('ws', () => {
    it('throws an error if an invalid version is requested', () => {
      const bfx = new BFX()
      assert.throws(bfx.ws.bind(bfx, 0))
      assert.throws(bfx.ws.bind(bfx, 3))
    })

    it('returns correct WebSocket api by version', () => {
      const bfx = new BFX()
      const wsDefault = bfx.ws()
      const ws1 = bfx.ws(1)
      const ws2 = bfx.ws(2)

      assert(wsDefault instanceof WSv2)
      assert(ws1 instanceof WSv1)
      assert(ws2 instanceof WSv2)
    })

    it('passes API keys & transform flag to new transport', () => {
      const bfx = new BFX({
        apiKey: 'k',
        apiSecret: 's',
        transform: true,
        wsURL: 'wss://',
      })

      const ws1 = bfx.ws(1)
      const ws2 = bfx.ws(2)

      assert.equal(ws1._apiKey, 'k')
      assert.equal(ws2._apiKey, 'k')
      assert.equal(ws1._apiSecret, 's')
      assert.equal(ws2._apiSecret, 's')
      assert.equal(ws1._url, 'wss://')
      assert.equal(ws2._url, 'wss://')
      assert.equal(ws2._transform, true)
    })

    it('passes extra options to new transport', () => {
      const bfx = new BFX()
      const ws2 = bfx.ws(2, { url: '/dev/null' })
      assert.equal(ws2._url, '/dev/null')
    })

    it('returns one instance if called twice for the same version', () => {
      const bfx = new BFX()
      const wsA = bfx.ws(2)
      const wsB = bfx.ws(2)

      assert(wsA === wsB)
    })
  })
})
