/* eslint-env mocha */
'use strict'

const assert = require('assert')
const _isObject = require('lodash/isObject')
const _isFunction = require('lodash/isFunction')

const { args, debug, debugTable, readline } = require('../../examples/util/setup')

describe('setup', () => {
  it('provides a debugger', () => {
    assert.ok(_isObject(args), 'setup doesnt provide a tooling object')
    assert.ok(_isFunction(debug), 'setup doesnt provide a debug() instance')
    assert.ok(_isFunction(debugTable), 'setup doesnt provide a debugTable() instance')
  })

  it('provides a readline instance', () => {
    assert.ok(_isFunction(readline.questionAsync), 'no readline instance provided')
  })
}).timeout(10 * 1000) // timeout for travis
