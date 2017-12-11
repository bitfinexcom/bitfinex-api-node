'use strict'

const Model = require('../model')

class Tick extends Model {
  serialize () {
    return [
      this.symbol,
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

  static unserialize (arr) {
    if (Array.isArray(arr[0])) {
      return arr.map(tick => Tick.unserialize(tick))
    }

    return {
      symbol: arr[0],
      frr: arr[1],
      bid: arr[2],
      bidPeriod: arr[3],
      bidSize: arr[4],
      ask: arr[5],
      askPeriod: arr[6],
      askSize: arr[7],
      dailyChange: arr[8],
      dailyChangePerc: arr[9],
      lastPrice: arr[10],
      volume: arr[11],
      high: arr[12],
      low: arr[13]
    }
  }
}

module.exports = Tick
