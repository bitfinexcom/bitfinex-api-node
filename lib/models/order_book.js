'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:orderbook')

/**
 * High level OB model to automatically integrate WS updates & maintain sort
 */
class OrderBook extends EventEmitter {
  /**
   * Initializes the order book with an existing snapshot (array form)
   * @param {Array[]} snapshot
   */
  constructor (snapshot) {
    super()

    this.bids = []
    this.asks = []

    for (let i = 0; i < snapshot.length; i++) {
      if (snapshot[i][2] < 0) {
        this.asks.push(snapshot[i])
      } else {
        this.bids.push(snapshot[i])
      }
    }
  }

  /**
   * Integrate an update packet; emits an 'update' event on success
   * @param {Array} entry
   */
  updateWith (entry) {
    const [price, count, amount] = entry
    const side = amount < 0 ? this.asks : this.bids

    if (count === 0) {
      for (let i = 0; i < side.length; i++) {
        if (side[i][0] === price) {
          side.splice(i, 1)
          return
        }
      }

      debug(`received rm entry for unknown price lvl: ${price}`)
      return // note it is not emitted
    }

    // TODO: Insert at the right place to avoid the sort() call below?
    for (let i = 0; i < side.length; i++) {
      if (side[i][0] === price) { // update
        side[i] = entry
        return this.emit('update')
      }
    }

    // insert
    side.push(entry)

    if (amount > 0) {
      side.sort((a, b) => b[0] - a[0])
    } else {
      side.sort((a, b) => a[0] - b[0])
    }

    this.emit('update')
  }

  /**
   * @return {number} price
   */
  midPrice () {
    return (this.asks[0][0] + this.bids[0][0]) / 2
  }
}

module.exports = OrderBook
