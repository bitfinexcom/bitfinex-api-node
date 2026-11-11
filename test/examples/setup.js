'use strict'

const test = require('brittle')
const _isObject = require('lodash/isObject')
const _isFunction = require('lodash/isFunction')

const { args, debug, debugTable, readline } = require('../../examples/util/setup')

test('setup', { timeout: 10 * 1000 }, async (t) => {
  await t.test('provides a debugger', (t) => {
    t.ok(_isObject(args), 'setup doesnt provide a tooling object')
    t.ok(_isFunction(debug), 'setup doesnt provide a debug() instance')
    t.ok(_isFunction(debugTable), 'setup doesnt provide a debugTable() instance')
  })

  await t.test('provides a readline instance', (t) => {
    t.ok(_isFunction(readline.questionAsync), 'no readline instance provided')
    readline.close()
  })
})
