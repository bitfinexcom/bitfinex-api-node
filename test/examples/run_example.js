/* eslint-env mocha */
'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const _isObject = require('lodash/isObject')
const _isFunction = require('lodash/isFunction')
const { RESTv2 } = require('bfx-api-node-rest')

const runExample = require('../../examples/util/run_example')
const WSv2 = require('../../lib/transports/ws2')

const getRunArgs = (override = {}) => ({
  name: 'self-test',
  noCatch: true,
  ...override
})

describe('runExample', () => {
  it('throws an error if no example name is provided', () => {
    try {
      runExample({}, async () => (assert.fail('example should not have executed')))
      assert.fail('error should have been thrown with missing name')
    } catch (e) {}

    try {
      runExample({ name: '' }, async () => (assert.fail('example should not have executed')))
      assert.fail('error should have been thrown with empty name')
    } catch (e) {}
  })

  it('supports async examples', (done) => {
    try {
      runExample(getRunArgs(), async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        done()
      })
    } catch (e) {
      assert.fail('should not have thrown an error with an async example func')
    }
  })

  it('passes a debugger to the example', (done) => {
    runExample(getRunArgs(), async (args) => {
      assert.ok(_isObject(args), 'example not passed a tooling object')
      assert.ok(_isFunction(args.debug), 'example not passed a debug() instance')
      done()
    })
  })

  it('passes a specialized table logging function to the example', (done) => {
    runExample(getRunArgs(), async (args) => {
      assert.ok(_isObject(args), 'example not passed a tooling object')
      assert.ok(_isFunction(args.debugTable), 'example not passed a debugTable() instance')
      done()
    })
  })

  it('catches example errors', () => {
    let exampleExecuted = false

    try {
      runExample(getRunArgs({ noCatch: false }), async () => {
        exampleExecuted = true
        throw new Error('test error')
      })
    } catch (e) {
      assert.fail('example error should have been caught internally')
    }

    assert.ok(exampleExecuted, 'example was not executed')
  })

  it('does not catch errors if noCatch is provided', () => {
    let errorThrown = false

    try {
      runExample(getRunArgs(), async () => {
        throw new Error('test error')
      })

      assert.fail('error was not propagated')
    } catch (e) {
      errorThrown = true
    }

    assert.ok(errorThrown, 'error was not thrown')
  })

  it('provides a RESTv2 client if requested', (done) => {
    runExample(getRunArgs({ rest: true }), async ({ rest }) => {
      assert.ok(rest instanceof RESTv2, 'no RESTv2 instance provided to example')
      done()
    })
  })

  it('parses .env and passes data to RESTv2 constructor if requested', (done) => {
    process.env.SOCKS_PROXY_URL = 'socks4://127.0.0.1:9998'
    process.env.REST_URL = 'localhost:8080'

    runExample(getRunArgs({
      rest: { env: true }
    }), async ({ rest }) => {
      assert.ok(rest.usesAgent(), 'RESTv2 instance provided to example does not use .env config')

      delete process.env.SOCKS_PROXY_URL
      delete process.env.REST_URL

      return runExample(getRunArgs({
        rest: { env: true }
      }), async ({ rest }) => {
        assert.ok(!rest.usesAgent(), 'RESTv2 instance provided to example uses .env config when not requested')
        assert.strictEqual(rest.getURL(), RESTv2.url, 'RESTv2 instance provided to example does not use default URL when no override configured')
        done()
      })
    })
  })

  it('passes extra RESTv2 args to constructor if provided', (done) => {
    const URL = 'http://localhost:42'

    runExample(getRunArgs({
      rest: { url: URL }
    }), async ({ rest }) => {
      assert.ok(rest instanceof RESTv2, 'did not receive a RESTv2 instance')
      assert.strictEqual(rest.getURL(), URL, 'RESTv2 args were not passed through')
      done()
    })
  })

  it('provides a WSv2 client if requested', (done) => {
    runExample(getRunArgs({
      ws: true
    }), async ({ ws }) => {
      assert.ok(ws instanceof WSv2, 'no WSv2 instance provided to example')
      done()
    })
  })

  it('parses .env and passes data to WSv2 constructor if requested', (done) => {
    process.env.SOCKS_PROXY_URL = 'socks4://127.0.0.1:9998'
    process.env.WS_URL = 'localhost:8080'

    runExample(getRunArgs({
      ws: { env: true }
    }), async ({ ws }) => {
      assert.ok(ws.usesAgent(), 'WSv2 instance provided to example not given connection agent')
      assert.strictEqual(ws.getURL(), 'localhost:8080', 'WSv2 instance provided to example not given connection url')

      delete process.env.SOCKS_PROXY_URL
      delete process.env.WS_URL

      return runExample(getRunArgs({
        ws: { env: true }
      }), async ({ ws }) => {
        assert.ok(!ws.usesAgent(), 'WSv2 instance provided to example used connection agent when none configured')
        assert.strictEqual(ws.getURL(), WSv2.url, 'WSv2 instance provided to example does not use default URL when no override configured')
        done()
      })
    })
  })

  it('passes extra WSv2 args to constructor if provided', (done) => {
    runExample(getRunArgs({
      ws: { seqAudit: true }
    }), async ({ ws }) => {
      assert.ok(ws instanceof WSv2, 'did not receive a WSv2 instance')
      assert.ok(ws.sequencingEnabled(), 'WSv2 args were not passed through')
      done()
    })
  })
})
