/* eslint-env mocha */

'use strict'

const {expect} = require('chai')
const BFX = require('../index')

describe('WebSocket', function () {
  this.timeout(5000)

  beforeEach(function () {
    const bitfinex = new BFX(
      'test',
      'test'
    )
    this.bitfinexWS = bitfinex.ws
  })

  afterEach(function (done) {
    this.bitfinexWS.close()
    this.bitfinexWS.on('close', () => {
      done()
    })
  })

  it('#trade data should have the defined fields', function (done) {
    this.bitfinexWS.once('trade', (pair, data) => {
      expect(pair).to.equal('BTCUSD')
      expect(data[0].seq).to.be.a('number')
      expect(data[0].timestamp).to.be.a('number')
      expect(data[0].price).to.be.a('number')
      expect(data[0].amount).to.be.a('number')
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
})
