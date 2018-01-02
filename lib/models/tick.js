'use strict'

const Model = require('../model')

class Tick extends Model {
  serialize () {
    if (!this.symbol) return []

    if (this.symbol[0] === 't') {
      return [
        this.symbol,
        this.bid,
        this.bidSize,
        this.ask,
        this.askSize,
        this.dailyChange,
        this.dailyChangePerc,
        this.lastPrice,
        this.volume,
        this.high,
        this.low
      ]
    } else {
      return [
        this.symbol,
        this.frr,
        this.bid,
        this.bidSize,
        this.bidPeriod,
        this.ask,
        this.askSize,
        this.askPeriod,
        this.dailyChange,
        this.dailyChangePerc,
        this.lastPrice,
        this.volume,
        this.high,
        this.low
      ]
    }
  }

  static unserialize (arr) {
    if (Array.isArray(arr[0])) {
      return arr.map(tick => Tick.unserialize(tick))
    } else if (!arr[0]) { // no symbol
      return null
    } else if (arr[0][0] === 't') {
      return {
        symbol: arr[0],
        bid: arr[1],
        bidSize: arr[2],
        ask: arr[3],
        askSize: arr[4],
        dailyChange: arr[5],
        dailyChangePerc: arr[6],
        lastPrice: arr[7],
        volume: arr[8],
        high: arr[9],
        low: arr[10]
      }
    }

    return {
      symbol: arr[0],
      frr: arr[1],
      bid: arr[2],
      bidSize: arr[3],
      bidPeriod: arr[4],
      ask: arr[5],
      askSize: arr[6],
      askPeriod: arr[7],
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
