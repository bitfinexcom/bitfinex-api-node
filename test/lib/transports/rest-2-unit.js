/* eslint-env mocha */
'use strict'

// const assert = require('assert')
// const RESTv2 = require('../../../lib/transports/rest2')

describe.skip('RESTv2 unit tests', () => {
  it('constructor: applies options')
  it('constructor: provides defaults')
  it('_generateNonce: increments internal nonce')

  it('_makeAuthRequest: calls cb w/ error on missing arguments')
  it('_makeAuthRequest: POSTs to the specified path')
  it('_makeAuthRequest: includes necessary headers')
  it('_makeAuthRequest: calls cb with an error, or response')
  it('_makeAuthRequest: transforms data if needed')

  it('_makePublicRequest: GETs the specified path')
  it('_makePublicRequest: calls cb with an error, or response')
  it('_makePublicRequest: transforms data if needed')

  it('_doTransform: returns empty array for no data')
  it('_doTransform: returns data if unable to transform')
  it('_doTransform: returns array of models for snapshots')
  it('_doTransform: returns single model')
})
