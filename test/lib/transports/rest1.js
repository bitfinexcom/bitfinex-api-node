'use strict'
/* eslint-env mocha */
/* eslint camelcase: "off" */
/* eslint-disable no-unused-expressions */

const assert = require('assert')
const { expect } = require('chai')
const DNS = require('dns')
const RESTv1 = require('../../../lib/transports/rest')
const _ = require('lodash')

describe('REST v1', () => {
  let skipPublic = process.env.SKIP_PUBLIC_REST

  if (!skipPublic) {
    before((done) => {
      DNS.resolve('api.bitfinex.com', (err) => {
        if (err) skipPublic = true
        done()
      })
    })
  }

  describe('errors', function () {
    const bfx_rest = new RESTv1()
    this.timeout(5000)
    it('should error out if a bad endpoint is given', () => {
      expect(bfx_rest.make_public_request).to.throw(Error)
    })
    it('should fail on authenticated requests if no api_key and api_secret', () => {
      expect(bfx_rest.account_infos).to.throw(Error)
    })
  })

  describe('public endpoints', function () {
    const bfx_rest = new RESTv1()
    this.timeout(10000) // bumped from 5k for moments of platform lag
    it('should get a ticker', (done) => {
      if (skipPublic) return done()

      bfx_rest.ticker('BTCUSD', (error, data) => {
        assert(!error)
        expect(data).to.exist
        expect(_.has(data, ['mid',
          'bid',
          'ask',
          'last_price',
          'low',
          'high',
          'volume',
          'timestamp']))
        done()
      })
    })
    it('should get the today endpoint', (done) => {
      if (skipPublic) return done()

      bfx_rest.today('BTCUSD', (error, data) => {
        assert(!error)
        expect(data).to.exist
        done()
      })
    })
    it('should get the stats', (done) => {
      if (skipPublic) return done()

      bfx_rest.stats('BTCUSD', (error, data) => {
        assert(!error)
        expect(data).to.exist
        expect(_.has(data[0], ['period', 'volume']))
        expect(_.has(data[1], ['period', 'volume']))
        expect(_.has(data[2], ['period', 'volume']))
        done()
      })
    })
    it('should get the fundingbook', (done) => {
      if (skipPublic) return done()

      bfx_rest.fundingbook('USD', (error, data) => {
        assert(!error)
        expect(data).to.exist
        expect(_.has(data, ['bids', 'asks']))
        expect(_.keys(data.bids[0])).is.eql(['rate', 'amount', 'period', 'timestamp', 'frr'])
        expect(_.keys(data.asks[0])).is.eql(['rate', 'amount', 'period', 'timestamp', 'frr'])
        expect(_.every([data.asks[0] + data.bids[0]]), !NaN).ok
        done()
      })
    })

    it('should get the orderbook', (done) => {
      if (skipPublic) return done()

      bfx_rest.orderbook('BTCUSD', (error, data) => {
        assert(!error)
        expect(data).to.exist
        expect(_.keys(data)).is.eql(['bids', 'asks'])
        expect(_.keys(data.bids[0])).is.eql(['price', 'amount', 'timestamp'])
        expect(_.keys(data.asks[0])).is.eql(['price', 'amount', 'timestamp'])
        expect(_.every([data.asks[0] + data.bids[0]]), !NaN).ok
        done()
      })
    })
    it('should get recent trades', (done) => {
      if (skipPublic) return done()

      bfx_rest.trades('BTCUSD', (error, data) => {
        assert(!error)
        expect(data).is.an.array
        expect(data.length).to.eql(100)
        expect(_.keys(data[0])).to.eql(['timestamp', 'tid', 'price', 'amount', 'exchange', 'type'])
        expect(
          _.map(_.values(data[0]), (v) => typeof (v))
        ).is.eql(['number', 'number', 'string', 'string', 'string', 'string'])
        done()
      })
    })
    it('should get recent lends', (done) => {
      if (skipPublic) return done()

      bfx_rest.lends('USD', (error, data) => {
        assert(!error)
        expect(data).to.exist
        expect(data).is.an.array
        expect(data.length).to.eql(50)
        expect(_.keys(data[0])).to.eql(['rate', 'amount_lent', 'amount_used', 'timestamp'])
        expect(
          _.map(_.values(data[0]), (v) => typeof (v))
        ).is.eql(['string', 'string', 'string', 'number'])
        done()
      })
    })
    it('should get symbols', (done) => {
      if (skipPublic) return done()

      bfx_rest.get_symbols((error, data) => {
        assert(!error)
        expect(data[0]).to.eql('btcusd')
        done()
      })
    })
    it('should get symbol details', (done) => {
      if (skipPublic) return done()

      bfx_rest.symbols_details((error, data) => {
        assert(!error)
        expect(data).to.exist
        expect(data[0].pair).to.eql('btcusd')
        done()
      })
    })
  })
})
