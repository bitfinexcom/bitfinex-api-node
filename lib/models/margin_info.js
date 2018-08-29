'use strict'

const Model = require('../model')

class MarginInfo extends Model {
  serialize () {
    const { type } = this

    if (type === 'base') {
      const { userPL, userSwaps, marginBalance, marginNet } = this

      return [
        type,
        [
          userPL,
          userSwaps,
          marginBalance,
          marginNet
        ]
      ]
    } else {
      const { symbol, tradableBalance, grossBalance, buy, sell } = this

      return [
        type,
        symbol,
        [
          tradableBalance,
          grossBalance,
          buy,
          sell
        ]
      ]
    }
  }

  static unserialize (arr) {
    const [ type ] = arr

    if (type === 'base') {
      const [, payload] = arr
      const [ userPL, userSwaps, marginBalance, marginNet ] = payload

      return {
        type,
        userPL,
        userSwaps,
        marginBalance,
        marginNet
      }
    } else {
      const [ , symbol, payload ] = arr
      const [ tradableBalance, grossBalance, buy, sell ] = payload

      return {
        type,
        symbol,
        tradableBalance,
        grossBalance,
        buy,
        sell
      }
    }
  }
}

module.exports = MarginInfo
