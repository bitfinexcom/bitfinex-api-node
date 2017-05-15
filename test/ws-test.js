/* eslint-env mocha */

'use strict'

const {expect} = require('chai')
const BFX = require('../index')
const testKeys = require('./keys.json')

describe('WebSocket', function () {
  this.timeout(3000)

  beforeEach(function () {
    const bitfinex = new BFX(
            testKeys.standard.api_key,
            testKeys.standard.api_secret
        )
    this.bitfinexWS = bitfinex.ws
        // this.bitfinexWS.on('open', done);
  })

  afterEach(function (done) {
    this.bitfinexWS.close()
    this.bitfinexWS.on('close', () => {
      done()
    })
  })

  it('should receive a pong after a ping', function (done) {
    this.bitfinexWS.on('pong', () => {
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.send({event: 'ping'})
    })
  })

  it('should receive a subscribed success messages', function (done) {
    this.bitfinexWS.on('subscribed', (data) => {
      expect(data).to.have.property('channel', 'trades')
      expect(data).to.have.property('pair', 'BTCUSD')
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.subscribeTrades('BTCUSD')
    })
  })

  it('should receive a pong after a ping', function (done) {
    this.bitfinexWS.on('pong', () => {
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.send({event: 'ping'})
    })
  })

  it('should receive info message', function (done) {
    this.bitfinexWS.on('info', (data) => {
      expect(data).is.eql({
        event: 'info',
        version: 1.1
      })
      done()
    })
  })

  it('#orderBook data should have the defined fields', function (done) {
    this.bitfinexWS.once('orderbook', (pair, data) => {
      expect(pair).to.equal('BTCUSD')
      expect(data.price).to.be.a('number')
      expect(data.count).to.be.a('number')
      expect(data.amount).to.be.a('number')
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.subscribeOrderBook('BTCUSD')
    })
  })

  it('#trade data should have the defined fields', function (done) {
    this.bitfinexWS.once('trade', (pair, data) => {
      expect(pair).to.equal('BTCUSD')
      expect(data.seq).to.be.a('number')
      expect(data.timestamp).to.be.a('number')
      expect(data.price).to.be.a('number')
      expect(data.amount).to.be.a('number')
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.subscribeTrades('BTCUSD')
    })
  })

  it('#ticker data should have the defined fields', function (done) {
    this.bitfinexWS.once('ticker', (pair, data) => {
      expect(pair).to.equal('BTCUSD')
      expect(data.bid).to.be.a('number')
      expect(data.bidSize).to.be.a('number')
      expect(data.ask).to.be.a('number')
      expect(data.askSize).to.be.a('number')
      expect(data.dailyChange).to.be.a('number')
      expect(data.dailyChangePerc).to.be.a('number')
      expect(data.lastPrice).to.be.a('number')
      expect(data.volume).to.be.a('number')
      expect(data.high).to.be.a('number')
      expect(data.low).to.be.a('number')
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.subscribeTicker('BTCUSD')
    })
  })

  it('should unsubscribe by channelId', function (done) {
    this.bitfinexWS.once('subscribed', (data) => {
      const channelId = data.chanId
      this.bitfinexWS.once('unsubscribed', (data) => {
        expect(data.status).to.equal('OK')
        expect(data.chanId).to.equal(channelId)
        done()
      })
      this.bitfinexWS.unsubscribe(channelId)
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.subscribeTicker('BTCUSD')
    })
  })

    // FIXME: The API key in keys.json is invalid, causing this test to fail.
  xit('should emit an auth event when authorized', function (done) {
    this.bitfinexWS.on('auth', (data) => {
      expect(data.status).to.equal('OK')
      done()
    })
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.auth()
    })
  })

  it('should emit an error when authorization fails', function (done) {
    this.bitfinexWS.APIKey = ''
    this.bitfinexWS.APISecret = ''

    this.bitfinexWS.on('error', () => {
      done()
    })

    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.auth()
    })
  })
})
