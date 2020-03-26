/* eslint-env mocha */
'use strict'

const assert = require('assert')
const _isUndefined = require('lodash/isUndefined')
const _isObject = require('lodash/isObject')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')
const SocksProxyAgent = require('socks-proxy-agent')
const argsFromEnv = require('../../examples/util/args_from_env')

describe('argsFromEnv', () => {
  it('pulls api credentials from the environment only if available', () => {
    delete process.env.API_KEY
    delete process.env.API_SECRET

    let args = argsFromEnv()

    assert.ok(_isObject(args), 'did not return an object')
    assert(_isUndefined(args.apiKey), 'api key parsed although not present on env')
    assert(_isUndefined(args.apiSecret), 'api secret parsed although not present on env')

    process.env.API_KEY = '42'
    process.env.API_SECRET = '9000'

    args = argsFromEnv()

    assert.ok(_isObject(args), 'did not return an object')
    assert.strictEqual(args.apiKey, '42', 'api key not pulled from env')
    assert.strictEqual(args.apiSecret, '9000', 'api secret not pull from env')
  })

  it('provides a connection agent if a socks proxy url is available on the env', () => {
    const url = 'socks4://localhost:9998'
    delete process.env.SOCKS_PROXY_URL

    let args = argsFromEnv()

    assert.ok(_isObject(args), 'did not return an object')
    assert.ok(_isUndefined(args.agent), 'agent provided although no config on env')

    process.env.SOCKS_PROXY_URL = url

    args = argsFromEnv()

    assert.ok(_isObject(args), 'did not return an object')
    assert.ok(args.agent instanceof SocksProxyAgent, 'did not provide a SocksProxyAgent instance')
    assert.ok(/localhost/.test(args.agent.proxy.host), 'provided agent does not use proxy url from env')
  })

  it('provides a connection url only if available', () => {
    const url = 'localhost:8080'
    delete process.env.TEST_URL

    let args = argsFromEnv('TEST_URL')

    assert.ok(_isObject(args), 'did not return an object')
    assert.ok(_isUndefined(args.url), 'url provided although no config on env')

    process.env.TEST_URL = url

    args = argsFromEnv('TEST_URL')

    assert.ok(_isObject(args), 'did not return an object')
    assert.ok(_isString(args.url) && !_isEmpty(args.url), 'connection url not pulled from env')
    assert.strictEqual(args.url, url, 'provided url does not match env var')
  })
})
