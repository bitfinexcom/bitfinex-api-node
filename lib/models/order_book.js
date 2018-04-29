'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws:orderbook')
const CRC = require('crc-32')

const { preparePrice } = require('../util/precision')

/**
 * High level OB model to automatically integrate WS updates & maintain sort
 */
class OrderBook extends EventEmitter {
  /**
   * Initializes the order book with an existing snapshot (array form)
   *
   * @param {Array[]|OrderBook} snapshot
   * @param {boolean?} raw - true for raw 'R0' order books
   */
  constructor (snap = [], raw = false) {
    super()

    this.raw = raw

    if (snap instanceof OrderBook) {
      this.bids = snap.bids.slice()
      this.asks = snap.asks.slice()
    } else if (snap && Array.isArray(snap)) {
      this.updateFromSnapshot(snap)
    } else if (snap && Array.isArray(snap.bids) && Array.isArray(snap.asks)) {
      this.bids = snap.bids.slice()
      this.asks = snap.asks.slice()
    } else {
      this.bids = []
      this.asks = []
    }
  }

  /**
   * Generates a crc-32 checksum of our current state. The checksum'ed string
   * itself is a concatenated list of the top 25 bids & asks, alternating.
   * @see http://blog.bitfinex.com/api/bitfinex-api-order-books-checksums
   *
   * @return {number} cs
   */
  checksum () {
    const { raw } = this
    const data = []

    for (let i = 0; i < 25; i += 1) {
      const bid = this.bids[i]
      const ask = this.asks[i]

      if (bid) {
        data.push(
          raw ? bid[0] : Number(preparePrice(bid[0])), // order ID or price
          bid[2] // amount
        )
      }

      if (ask) {
        data.push(
          raw ? ask[0] : Number(preparePrice(ask[0])), //
          ask[2] //
        )
      }
    }

    return CRC.str(data.join(':'))
  }

  /**
   * Like checksum(), but for raw array-format order books
   *
   * @param {Array[]} arr - assumed sorted, [topBid, bid, ..., topAsk, ask, ...]
   * @param {boolean?} raw - true for raw 'R0' order books
   * @return {number} cs
   */
  static checksumArr (arr, raw = false) {
    let topAskI = -1

    // find first ask (book is sorted bids first)
    for (let i = 0; i < arr.length; i += 1) {
      if (arr[i][2] < 0) {
        topAskI = i
        break
      }
    }

    const data = []

    let ask
    let bid

    // Either bids/asks may be empty, or have differing lengths
    for (let i = 0; i < 25; i += 1) {
      bid = topAskI === -1 || i < topAskI // still reading bids
        ? arr[i]
        : null // reached asks

      ask = topAskI === -1
        ? null
        : arr[topAskI + i]

      if (bid) {
        data.push(
          raw ? bid[0] : Number(preparePrice(bid[0])), // order ID or price
          bid[2] // amount
        )
      }

      if (ask) {
        data.push(
          raw ? ask[0] : Number(preparePrice(ask[0])), //
          ask[2] //
        )
      }
    }

    return CRC.str(data.join(':'))
  }

  updateFromSnapshot (snapshot) {
    this.bids = []
    this.asks = []

    for (let i = 0; i < snapshot.length; i++) {
      if (snapshot[i][2] < 0) {
        this.asks.push(snapshot[i])
      } else {
        this.bids.push(snapshot[i])
      }
    }

    // snapshots may not be sorted
    const priceI = this.raw ? 1 : 0

    this.bids.sort((a, b) => b[priceI] - a[priceI])
    this.asks.sort((a, b) => a[priceI] - b[priceI])
  }

  /**
   * Integrate an update packet (add, update, or remove a price level). Emits an
   * 'update' event on success
   *
   * @param {Array} entry
   * @return {boolean} success - false if entry doesn't match OB
   */
  updateWith (entry) {
    const { raw } = this
    const priceI = raw ? 1 : 0
    const count = raw ? -1 : entry[1]
    const price = entry[priceI]
    const oID = entry[0] // only for raw books
    const amount = entry[2]
    const side = amount < 0 ? this.asks : this.bids

    let insertIndex = -1

    // apply insert directly if empty
    if (side.length === 0 && (raw || count > 0)) {
      side.push(entry)
      this.emit('update', entry)
      return true
    }

    for (let i = 0; i < side.length; i++) {
      if (insertIndex === -1 && (
        (amount > 0 && price > side[i][priceI]) ||
        (amount < 0 && price < side[i][priceI])
      )) {
        insertIndex = i // insert index to maintain sort
      }

      // Match by price level, or order ID for raw books
      if ((!raw && side[i][priceI] === price) || (raw && side[i][0] === oID)) {
        if ((!raw && count === 0) || (raw && price === 0)) {
          side.splice(i, 1) // remove
        } else if (!raw || (raw && price > 0)) {
          side[i] = entry // update
        }

        this.emit('update', entry)
        return true
      }
    }

    // remove unkown
    if ((raw && price === 0) || (!raw && count === 0)) {
      debug(`ignoring unknown price level: ${JSON.stringify(entry)}`)
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
   * @return {number} topBid - may be null
   */
  topBid () {
    const priceI = this.raw ? 1 : 0
    return (this.topBidLevel() || [])[priceI] || null
  }

  /**
   * @return {number} topBidLevel - may be null
   */
  topBidLevel () {
    return this.bids[0] || null
  }

  /**
   * @return {number} topAsk - may be null
   */
  topAsk () {
    const priceI = this.raw ? 1 : 0
    return (this.topAskLevel() || [])[priceI] || null
  }

  /**
   * @return {number} topAskLevel - may be null
   */
  topAskLevel () {
    return this.asks[0] || null
  }

  /**
   * @return {number} price
   */
  midPrice () {
    const priceI = this.raw ? 1 : 0
    const topAsk = (this.asks[0] || [])[priceI] || 0
    const topBid = (this.bids[0] || [])[priceI] || 0

    if (topAsk === 0) return topBid
    if (topBid === 0) return topAsk

    return (topAsk + topBid) / 2
  }

  /**
   * @return {number} spread - top bid/ask difference
   */
  spread () {
    const priceI = this.raw ? 1 : 0
    const topAsk = (this.asks[0] || [])[priceI] || 0
    const topBid = (this.bids[0] || [])[priceI] || 0

    if (topAsk === 0 || topBid === 0) {
      return 0
    }

    return topAsk - topBid
  }

  /**
   * @return {number} amount - total buy-side volume
   */
  bidAmount () {
    let amount = 0

    for (let i = 0; i < this.bids.length; i++) {
      amount += this.bids[i][2]
    }

    return amount
  }

  /**
   * @return {number} amount - total sell-side volume
   */
  askAmount () {
    let amount = 0

    for (let i = 0; i < this.asks.length; i++) {
      amount += this.asks[i][2]
    }

    return Math.abs(amount)
  }

  /**
   * @param {number} price
   * @return {Object} entry - unserialized, null if not found
   */
  getEntry (price) {
    const priceI = this.raw ? 1 : 0
    const side = this.asks.length > 0
      ? price >= this.asks[0][priceI] ? this.asks : this.bids
      : price <= this.bids[0][priceI] ? this.bids : this.asks

    for (let i = 0; i < side.length; i++) {
      if (price === side[i][priceI]) {
        return OrderBook.unserialize(side[i])
      }
    }

    return null
  }

  serialize () {
    return (this.asks || []).concat(this.bids || [])
  }

  /**
   * Modifies an array-format OB in place with an update entry. Sort is not
   * gauranteed!
   *
   * @param {number[][]} ob
   * @param {number[]} entry
   * @param {boolean?} raw - true for raw 'R0' order books
   * @return {boolean} success - false if entry doesn't match OB
   */
  static updateArrayOBWith (ob, entry, raw = false) {
    const priceI = raw ? 1 : 0
    const price = entry[priceI]
    const count = raw ? -1 : entry[1]
    let insertIndex = -1

    for (let i = 0; i < ob.length; i++) {
      if (price > ob[i][priceI] && insertIndex === -1) {
        insertIndex = i
      }

      if ((!raw && ob[i][priceI] === price) || (raw && ob[i][0] === entry[0])) {
        if ((!raw && count === 0) || (raw && price === 0)) {
          ob.splice(i, 1) // remove existing
        } else {
          ob[i] = entry // update existing
        }

        return true
      }
    }

    // remove unkown
    if ((!raw && count === 0) || (raw && price === 0)) return false

    // add
    if (insertIndex === -1) {
      ob.push(entry)
    } else {
      ob.splice(insertIndex, 0, entry)
    }

    return true
  }

  static arrayOBMidPrice (ob = [], raw = false) {
    if (ob.length === 0) return null

    const priceI = raw ? 1 : 0
    let bestBuy = -Infinity
    let bestAsk = Infinity
    let entry

    for (let i = 0; i < ob.length; i++) {
      entry = ob[i]

      if (entry[2] > 0 && entry[priceI] > bestBuy) bestBuy = entry[priceI]
      if (entry[2] < 0 && entry[priceI] < bestAsk) bestAsk = entry[priceI]
    }

    if (bestBuy === -Infinity || bestAsk === Infinity) return null

    return (bestAsk + bestBuy) / 2.0
  }

  /**
   * Converts an array order book entry or snapshot to an object, with 'price',
   * 'count', and 'amount' keys on entries
   *
   * @param {number[]|number[][]} arr
   * @param {boolean?} raw - true for raw 'R0' order books
   * @return {Object} ob - either a map w/ bids & asks, or single entry object
   */
  static unserialize (arr, raw = false) {
    if (Array.isArray(arr[0])) {
      const entries = arr.map(e => OrderBook.unserialize(e))
      const bids = entries.filter(e => e.amount > 0)
      const asks = entries.filter(e => e.amount < 0)

      return { bids, asks }
    }

    return raw ? {
      orderID: arr[0],
      price: arr[1],
      amount: arr[2]
    } : {
      price: arr[0],
      count: arr[1],
      amount: arr[2]
    }
  }
}

module.exports = OrderBook
