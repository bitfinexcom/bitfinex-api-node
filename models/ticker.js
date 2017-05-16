'use strict'
class Ticker {
  constructor (tickerResponse) {
    [
      this.bid, this.bidSize,
      this.ask, this.askSize,
      this.dailyChange, this.dailyChangePct,
      this.lastPrice,
      this.volume,
      this.high,
      this.low
    ] = tickerResponse
  }
}

module.exports = Ticker
