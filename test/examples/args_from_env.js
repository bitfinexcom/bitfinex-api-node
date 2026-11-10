'use strict'

const test = require('brittle')
const _isUndefined = require('lodash/isUndefined')
const _isObject = require('lodash/isObject')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')
const { SocksProxyAgent } = require('socks-proxy-agent')
const argsFromEnv = require('../../examples/util/args_from_env')

test('argsFromEnv', async (t) => {
  await t.test('pulls api credentials from the environment only if available', (t) => {
    delete process.env.API_KEY
    delete process.env.API_SECRET

    let args = argsFromEnv()

    t.ok(_isObject(args), 'did not return an object')
    t.ok(_isUndefined(args.apiKey), 'api key parsed although not present on env')
    t.ok(_isUndefined(args.apiSecret), 'api secret parsed although not present on env')

    process.env.API_KEY = '42'
    process.env.API_SECRET = '9000'

    args = argsFromEnv()

    t.ok(_isObject(args), 'did not return an object')
    t.is(args.apiKey, '42', 'api key not pulled from env')
    t.is(args.apiSecret, '9000', 'api secret not pull from env')
  })

  await t.test('provides a connection agent if a socks proxy url is available on the env', (t) => {
    const url = 'socks4://localhost:9998'
    delete process.env.SOCKS_PROXY_URL

    let args = argsFromEnv()

    t.ok(_isObject(args), 'did not return an object')
    t.ok(_isUndefined(args.agent), 'agent provided although no config on env')

    process.env.SOCKS_PROXY_URL = url

    args = argsFromEnv()

    t.ok(_isObject(args), 'did not return an object')
    t.ok((args.agent instanceof SocksProxyAgent), 'did not provide a SocksProxyAgent instance')
    t.ok(/localhost/.test(args.agent.proxy.host), 'provided agent does not use proxy url from env')
  })

  await t.test('provides a connection url only if available', (t) => {
    const url = 'localhost:8080'
    delete process.env.TEST_URL

    let args = argsFromEnv('TEST_URL')

    t.ok(_isObject(args), 'did not return an object')
    t.ok(_isUndefined(args.url), 'url provided although no config on env')

    process.env.TEST_URL = url

    args = argsFromEnv('TEST_URL')

    t.ok(_isObject(args), 'did not return an object')
    t.ok(_isString(args.url) && !_isEmpty(args.url), 'connection url not pulled from env')
    t.is(args.url, url, 'provided url does not match env var')
  })
})
