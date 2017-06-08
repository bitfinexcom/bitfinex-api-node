/* eslint-env mocha */

'use strict'

const {expect} = require('chai')
const BFX = require('../../index')
const testKeys = require('./../keys.json')
const version = 2
const Ticker = require('../../models/ticker')

describe('WebSocket response mappers', function () {
  this.timeout(3000)

  beforeEach(function () {
    const bitfinex = new BFX(
            testKeys.standard.api_key,
            testKeys.standard.api_secret,
            version
        )
    this.bitfinexWS = bitfinex.ws
  })

  afterEach(function (done) {
    this.bitfinexWS.close()
    this.bitfinexWS.on('close', () => {
      done()
    })
  })

  it('should correctly map ticker response', function (done) {
    this.bitfinexWS.on('open', () => {
      this.bitfinexWS.send({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tBTCUSD'
      })

      this.bitfinexWS.on('ticker', (symbol, msg) => {
        var ticker = new Ticker(msg)
        expect(ticker.bid).to.be.a('number')
        expect(ticker.bidSize).to.be.a('number')
        expect(ticker.ask).to.be.a('number')
        expect(ticker.askSize).to.be.a('number')
        expect(ticker.dailyChange).to.be.a('number')
        expect(ticker.dailyChangePct).to.be.a('number')
        expect(ticker.lastPrice).to.be.a('number')
        expect(ticker.volume).to.be.a('number')
        expect(ticker.high).to.be.a('number')
        expect(ticker.low).to.be.a('number')
        done()
      })
    })
  })
})
