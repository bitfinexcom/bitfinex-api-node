'use strict'

const { EventEmitter } = require('events')

/**
 * High level OB model to automatically integrate WS updates & maintain sort
 */
class OrderBook extends EventEmitter {
  /**
   * Initializes the order book with an existing snapshot (array form)
   * @param {Array[]} snapshot
   */
  constructor (snapshot = []) {
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
   *
   * @param {Array} entry
   * @return {boolean} success - false if entry doesn't match OB
   */
  updateWith (entry) {
    const [price, count, amount] = entry
    const side = amount < 0 ? this.asks : this.bids
    let insertIndex = -1

    for (let i = 0; i < side.length; i++) {
      if (insertIndex === -1 && (
        (amount > 0 && price > side[i][0]) ||
        (amount < 0 && price < side[i][0])
      )) {
        insertIndex = i
      }

      if (side[i][0] === price) {
        if (count === 0) {        // remove
          side.splice(i, 1)
        } else {
          side[i] = entry         // update
        }

        this.emit('update', entry)
        return true
      }
    }

    // remove unkown
    if (count === 0) {
      this.emit('error', new Error(
        `can't remove unknown price level: ${JSON.stringify(entry)}`
      ))

      return false
    }

    // add
    if (insertIndex === -1) {
      side.push(entry)
    } else {
      side.splice(insertIndex, 0, entry)
    }

    this.emit('update', entry)
    return true
  }

  /**
   * @return {number} price
   */
  midPrice () {
    return (this.asks[0][0] + this.bids[0][0]) / 2
  }

  /**
   * @param {number} price
   * @return {Object} entry - unserialized, null if not found
   */
  getEntry (price) {
    const side = price >= this.asks[0][0] ? this.asks : this.bids

    for (let i = 0; i < side.length; i++) {
      if (price === side[i][0]) {
        return OrderBook.unserialize(side[i])
      }
    }

    return null
  }

  /**
   * Modifies an array-format OB in place with an update entry. Sort is not
   * gauranteed!
   *
   * @param {number[][]} ob
   * @param {number[]} entry
   * @return {boolean} success - false if entry doesn't match OB
   */
  static updateArrayOBWith (ob, entry) {
    const [price, count, amount] = entry
    let insertIndex = -1

    for (let i = 0; i < ob.length; i++) {
      if (price > ob[i][0] && insertIndex === -1) insertIndex = i

      if (ob[i][0] === price) {
        if (count === 0) {
          ob.splice(i, 1) // remove existing
        } else {
          ob[i] = entry   // update existing
        }

        return true
      }
    }

    // remove unkown
    if (count === 0) return false

    // add
    if (insertIndex === -1) {
      ob.push(entry)
    } else {
      ob.splice(insertIndex, 0, entry)
    }

    return true
  }

  /**
   * Converts an array order book entry or snapshot to an object, with 'price',
   * 'count', and 'amount' keys on entries
   *
   * @param {number[]|number[][]} arr
   * @return {Object} ob - either a map w/ bids & asks, or single entry object
   */
  static unserialize (arr) {
    if (Array.isArray(arr[0])) {
      const entries = arr.map(e => OrderBook.unserialize(e))
      const bids = entries.filter(e => e.amount > 0)
      const asks = entries.filter(e => e.amount < 0)

      return { bids, asks }
    }

    return {
      price: arr[0],
      count: arr[1],
      amount: arr[2]
    }
  }
}

module.exports = OrderBook
