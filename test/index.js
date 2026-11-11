'use strict'

const test = require('brittle')
const BFX = require('../index')
const { RESTv1, RESTv2 } = require('bfx-api-node-rest')
const WSv1 = require('bfx-api-node-ws1')
const WSv2 = require('../lib/transports/ws2')

test('BFX', async (t) => {
  await t.test('should be loaded', (t) => {
    t.is(typeof BFX, 'function')
  })

  await t.test('constructor', async (t) => {
    await t.test('throws on using the deprecated way to set options', (t) => {
      t.exception.all(() => new BFX(2, {}))
      t.exception.all(() => new BFX('dummy', 'dummy', 2))
    })
  })

  await t.test('rest', async (t) => {
    await t.test('throws an error if an invalid version is requested', (t) => {
      const bfx = new BFX()
      t.exception.all(bfx.rest.bind(bfx, 0))
      t.exception.all(bfx.rest.bind(bfx, 3))
    })

    await t.test('returns correct REST api by version', (t) => {
      const bfx = new BFX()
      const restDefault = bfx.rest()
      const rest1 = bfx.rest(1)
      const rest2 = bfx.rest(2)

      t.ok(restDefault instanceof RESTv2)
      t.ok(rest1 instanceof RESTv1)
      t.ok(rest2 instanceof RESTv2)
    })

    await t.test('passes API keys & transform flag to new transport', (t) => {
      const bfx = new BFX({
        apiKey: 'k',
        apiSecret: 's',
        transform: true,
        rest: {
          url: 'http://'
        }
      })

      const rest1 = bfx.rest(1)
      const rest2 = bfx.rest(2)

      t.is(rest1._apiKey, 'k')
      t.is(rest2._apiKey, 'k')
      t.is(rest1._apiSecret, 's')
      t.is(rest2._apiSecret, 's')
      t.is(rest1._url, 'http://')
      t.is(rest2._url, 'http://')
      t.is(rest2._transform, true)
    })

    await t.test('passes extra options to new transport', (t) => {
      const bfx = new BFX()
      const rest2 = bfx.rest(2, { url: '/dev/null' })
      t.is(rest2._url, '/dev/null')
    })

    await t.test('returns one instance if called twice for the same version', (t) => {
      const bfx = new BFX()
      const restA = bfx.rest(2)
      const restB = bfx.rest(2)
      t.ok(restA === restB)
    })
  })

  await t.test('ws', async (t) => {
    await t.test('throws an error if an invalid version is requested', (t) => {
      const bfx = new BFX()
      t.exception.all(bfx.ws.bind(bfx, 0))
      t.exception.all(bfx.ws.bind(bfx, 3))
    })

    await t.test('returns correct WebSocket api by version', (t) => {
      const bfx = new BFX()
      const wsDefault = bfx.ws()
      const ws1 = bfx.ws(1)
      const ws2 = bfx.ws(2)

      t.ok(wsDefault instanceof WSv2)
      t.ok(ws1 instanceof WSv1)
      t.ok(ws2 instanceof WSv2)
    })

    await t.test('passes API keys & transform flag to new transport', (t) => {
      const bfx = new BFX({
        apiKey: 'k',
        apiSecret: 's',
        transform: true,
        ws: {
          url: 'wss://'
        }
      })

      const ws1 = bfx.ws(1)
      const ws2 = bfx.ws(2)

      t.is(ws1._apiKey, 'k')
      t.is(ws2._authArgs.apiKey, 'k')
      t.is(ws1._apiSecret, 's')
      t.is(ws2._authArgs.apiSecret, 's')
      t.is(ws1._url, 'wss://')
      t.is(ws2._url, 'wss://')
      t.is(ws2._transform, true)
    })

    await t.test('passes extra options to new transport', (t) => {
      const bfx = new BFX()
      const ws2 = bfx.ws(2, { url: '/dev/null' })
      t.is(ws2._url, '/dev/null')
    })

    await t.test('returns one instance if called twice for the same version', (t) => {
      const bfx = new BFX()
      const wsA = bfx.ws(2)
      const wsB = bfx.ws(2)

      t.ok(wsA === wsB)
    })
  })
})
