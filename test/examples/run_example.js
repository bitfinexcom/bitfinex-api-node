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
  testing: true,
  ...override
})

describe('runExample', () => {
  it('throws an error if no example name is provided', () => {
    try {
      runExample({}, () => (assert.fail('example should not have executed')))
      assert.fail('error should have been thrown with missing name')
    } catch (e) {
      assert.ok(!!e)
    }

    try {
      runExample({ name: '' }, async () => (assert.fail('example should not have executed')))
      assert.fail('error should have been thrown with empty name')
    } catch (e) {
      assert.ok(!!e)
    }
  })

  it('supports async examples', (done) => {
    try {
      runExample(getRunArgs(), async () => {
        await Promise.delay(10)
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

  it.skip('catches example errors', async () => {
    let exampleExecuted = false

    try {
      await runExample(getRunArgs({ testing: false }), () => {
        exampleExecuted = true
        throw new Error('test error')
      })()
    } catch (e) {
      assert.fail('example error should have been caught internally')
    }

    assert.ok(exampleExecuted, 'example was not executed')
  })

  it.skip('does not catch errors if testing is provided', () => {
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

  it('parses .env and passes data to RESTv2 constructor if requested', async () => {
    process.env.SOCKS_PROXY_URL = 'socks4://127.0.0.1:9998'
    process.env.REST_URL = 'localhost:8080'

    await runExample(getRunArgs({
      rest: { env: true }
    }), ({ rest }) => {
      assert.ok(rest.usesAgent(), 'RESTv2 instance provided to example does not use .env config')

      delete process.env.SOCKS_PROXY_URL
      delete process.env.REST_URL
    })

    return runExample(getRunArgs({
      rest: { env: true }
    }), async ({ rest }) => {
      assert.ok(!rest.usesAgent(), 'RESTv2 instance provided to example uses .env config when not requested')
      assert.strictEqual(rest.getURL(), RESTv2.url, 'RESTv2 instance provided to example does not use default URL when no override configured')
    })
  })

  it('passes extra RESTv2 args to constructor if provided', (done) => {
    const URL = 'http://google.com'

    runExample(getRunArgs({
      rest: { url: URL }
    }), ({ rest }) => {
      assert.ok(rest instanceof RESTv2, 'did not receive a RESTv2 instance')
      assert.strictEqual(rest.getURL(), URL, 'RESTv2 args were not passed through')
      done()
    })
  }).timeout(10000)

  it('provides a WSv2 client if requested', (done) => {
    runExample(getRunArgs({
      ws: true
    }), ({ ws }) => {
      assert.ok(ws instanceof WSv2, 'no WSv2 instance provided to example')
      done()
    })
  }).timeout(10000)

  it('parses .env and passes data to WSv2 constructor if requested', async () => {
    process.env.SOCKS_PROXY_URL = 'socks4://127.0.0.1:9998'
    process.env.WS_URL = 'localhost:8080'

    await runExample(getRunArgs({
      ws: { env: true }
    }), ({ ws }) => {
      assert.ok(ws.usesAgent(), 'WSv2 instance provided to example not given connection agent')
      assert.strictEqual(ws.getURL(), 'localhost:8080', 'WSv2 instance provided to example not given connection url')

      delete process.env.SOCKS_PROXY_URL
      delete process.env.WS_URL
    })

    return runExample(getRunArgs({
      ws: { env: true }
    }), ({ ws }) => {
      assert.ok(!ws.usesAgent(), 'WSv2 instance provided to example used connection agent when none configured')
      assert.strictEqual(ws.getURL(), WSv2.url, 'WSv2 instance provided to example does not use default URL when no override configured')
    })
  }).timeout(10000)

  it('passes extra WSv2 args to constructor if provided', (done) => {
    runExample(getRunArgs({
      ws: { seqAudit: true }
    }), async ({ ws }) => {
      assert.ok(ws instanceof WSv2, 'did not receive a WSv2 instance')
      assert.ok(ws.sequencingEnabled(), 'WSv2 args were not passed through')
      done()
    })
  }).timeout(10000)

  it('closes WSv2 on example end if left open', (done) => {
    runExample(getRunArgs({
      ws: true
    }), async ({ ws }) => {
      ws.on('close', done)

      await ws.open()
    })
  }).timeout(6000)

  it('does not close WSv2 on example end if requested not too', (done) => {
    runExample(getRunArgs({
      ws: { connect: true, keepOpen: true }
    }), async ({ ws }) => {
      setTimeout(async () => {
        ws.once('close', done)
        await ws.close()
      }, 20)
    })
  }).timeout(4000)

  it('provides a readline instance if requested', () => {
    runExample(getRunArgs({ readline: true }), ({ readline }) => {
      assert.ok(_isFunction(readline.questionAsync), 'no readline instance provided')
    })
  })

  it('automatically closes the readline instance if provided and not already closed', (done) => {
    runExample(getRunArgs({ readline: true }), ({ readline }) => {
      readline.on('close', done)
    })
  })
}).timeout(10 * 1000) // timeout for travis
