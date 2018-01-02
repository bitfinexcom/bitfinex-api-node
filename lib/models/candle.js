'use strict'

const Model = require('../model')

class Candle extends Model {
  serialize () {
    return [
      this.mts,
      this.open,
      this.close,
      this.high,
      this.low,
      this.volume
    ]
  }

  static unserialize (arr) {
    if (Array.isArray(arr[0])) {
      return arr.map(candle => Candle.unserialize(candle))
    }

    return {
      mts: arr[0],
      open: arr[1],
      close: arr[2],
      high: arr[3],
      low: arr[4],
      volume: arr[5]
    }
  }
}

module.exports = Candle
