'use strict'

const Model = require('../model')

class Tick extends Model {
  serialize() {
    return [
      this.frr,
      this.bid,
      this.bidPeriod,
      this.bidSize,
      this.ask,
      this.askPeriod,
      this.askSize,
      this.dailyChange,
      this.dailyChangePerc,
      this.lastPrice,
      this.volume,
      this.high,
      this.low
    ]
  }

  static unserialize(arr) {
    if (typeof arr[0] === 'string') { // /tickers endpoint...
      arr = arr.splice(0, 1)
    }

    return {
      frr: arr[0],
      bid: arr[1],
      bidPeriod: arr[2],
      bidSize: arr[3],
      ask: arr[4],
      askPeriod: arr[5],
      askSize: arr[6],
      dailyChange: arr[7],
      dailyChangePerc: arr[8],
      lastPrice: arr[9],
      volume: arr[10],
      high: arr[11],
      low: arr[12]
    }
  }
}

module.exports = Tick
