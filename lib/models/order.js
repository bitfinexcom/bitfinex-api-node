'use strict'

const Promise = require('bluebird')
const Model = require('../model')
let lastCID = Date.now()

/**
 * High level order model; provides methods for execution & can stay updated via
 * a WSv2 connection
 */
class Order extends Model {
  /**
   * @param {Object|Array} data - either a map of order fields or a raw array
   * @param {WSv2} ws - optional, saved for a later call to registerListeners()
   */
  constructor (data, ws) {
    super(data)

    this._ws = ws
    this._lastAmount = this.amount

    this._onWSOrderNew = this._onWSOrderNew.bind(this)
    this._onWSOrderUpdate = this._onWSOrderUpdate.bind(this)
    this._onWSOrderClose = this._onWSOrderClose.bind(this)
  }

  /**
   * Registers for updates/persistence on the specified ws2 instance
   *
   * @param {WSv2} ws - optional, defaults to internal ws
   */
  registerListeners (ws = this._ws) {
    if (!ws) return

    const chanData = {
      symbol: this.symbol,
      cid: this.cid || null,
      cbGID: this.cbGID()
    }

    ws.onOrderNew(chanData, this._onWSOrderNew)
    ws.onOrderUpdate(chanData, this._onWSOrderUpdate)
    ws.onOrderClose(chanData, this._onWSOrderClose)

    this._ws = ws
  }

  /**
   * Removes update listeners from the specified ws2 instance
   *
   * @param {WSv2} ws - optional, defaults to internal ws
   */
  removeListeners (ws = this._ws) {
    if (ws) ws.removeListeners(this.cbGID())
  }

  /**
   * @return {string} cbGID
   */
  cbGID () {
    return `${this.gid}.${this.cid}`
  }

  /**
   * @param {WSv2} ws - optional, defaults to internal ws
   * @return {Promise} p
   */
  submit (ws = this._ws) {
    if (!ws) return Promise.reject(new Error('no ws connection'))

    return ws.submitOrder(this).then((orderArr) => {
      Object.assign(this, Order.unserialize(orderArr))

      return this
    })
  }

  /**
   * @param {WSv2} ws - optional, defaults to internal ws
   * @return {Promise} p
   */
  cancel (ws = this._ws) {
    if (!ws) return Promise.reject(new Error('no ws connection'))
    if (!this.id) return Promise.reject(new Error('order has no ID'))

    return ws.cancelOrder(this.id)
  }

  /**
   * Equivalent to calling cancel() followed by submit()
   *
   * @param {WSv2} ws - optional, defaults to internal ws
   * @return {Promise} p
   */
  recreate (ws = this._ws) {
    if (!ws) return Promise.reject(new Error('no ws connection'))
    if (!this.id) return Promise.reject(new Error('order has no ID'))

    return this.cancel(ws).then(() => {
      this.id = null

      return this.submit(ws)
    })
  }

  /**
   * Query the amount that was filled on the last order update
   *
   * @return {number} amount
   */
  getLastFillAmount () {
    return this._lastAmount - this.amount
  }

  /**
   * @return {string} currency
   */
  getBaseCurrency () {
    return this.symbol.substring(1, 4)
  }

  /**
   * @return {string} currency
   */
  getQuoteCurrency () {
    return this.symbol.substring(4)
  }

  /**
   * @return {number} value
   */
  getNotionalValue () {
    return Math.abs(this.amount * this.price)
  }

  /**
   * @param {Array} order
   * @private
   */
  _onWSOrderUpdate (order) {
    this._lastAmount = this.amount
    Object.assign(this, Order.unserialize(order))

    this.emit('update')
  }

  /**
   * @param {Array} order
   * @private
   */
  _onWSOrderClose (order) {
    this._lastAmount = this.amount
    Object.assign(this, Order.unserialize(order))

    this.emit('close')
  }

  /**
   * @param {Array} order
   * @private
   */
  _onWSOrderNew (order) {
    this._lastAmount = this.amount
    Object.assign(this, Order.unserialize(order))

    this.emit('update')
  }

  /**
   * @return {Array} o
   */
  serialize () {
    return [
      this.id,
      this.gid,
      this.cid,
      this.symbol,
      this.mtsCreate,
      this.mtsUpdate,
      this.amount,
      this.amountOrig,
      this.type,
      this.typePrev,
      null,
      null,
      this.flags,
      this.status,
      null,
      null,
      this.price,
      this.priceAvg,
      this.priceTrailing,
      this.priceAuxLimit,
      null,
      null,
      null,
      this.notify ? 1 : 0,
      this.hidden ? 1 : 0,
      this.placedId
    ]
  }

  /**
   * Creates an order map that can be passed to the `on` command.
   *
   * @return {Object} o
   */
  toNewOrderPacket () {
    return {
      gid: this.gid,
      cid: isNaN(this.cid) ? lastCID++ : this.cid,
      symbol: this.symbol,
      type: this.type,
      price_trailing: `${this.priceTrailing || ''}`,
      price_aux_limit: `${this.priceAuxLimit || ''}`,
      price: `${this.price}`,
      amount: `${this.amount}`,
      hidden: this.hidden ? 1 : 0,
      postonly: this.postonly ? 1 : 0
    }
  }

  /**
   * @param {Array} arr
   * @return {Object} order
   */
  static unserialize (arr) {
    return {
      id: arr[0],
      gid: arr[1],
      cid: arr[2],
      symbol: arr[3],
      mtsCreate: arr[4],
      mtsUpdate: arr[5],
      amount: arr[6],
      amountOrig: arr[7],
      type: arr[8],
      typePrev: arr[9],
      flags: arr[12],
      status: arr[13],
      price: arr[16],
      priceAvg: arr[17],
      priceTrailing: arr[18],
      priceAuxLimit: arr[19],
      notify: arr[23] === 1,
      hidden: arr[24] === 1,
      placedId: arr[25]
    }
  }

  /**
   * @param {Array} arr - order in ws2 array format
   * @return {string} currency - base currency from symbol
   */
  static getBaseCurrency (arr = []) {
    return (arr[3] || '').substring(1, 4).toUpperCase()
  }

  /**
   * @param {Array} arr - order in ws2 array format
   * @return {string} currency - quote currency from symbol
   */
  static getQuoteCurrency (arr = []) {
    return (arr[3] || '').substring(4).toUpperCase()
  }
}

Order.type = {}
Order.status = {}

const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELLED']
const types = [
  'MARKET', 'EXCHANGE MARKET', 'LIMIT', 'EXCHANGE LIMIT', 'STOP',
  'EXCHANGE STOP', 'TRAILING STOP', 'EXCHANGE TRAILING STOP', 'FOK',
  'EXCHANGE FOK', 'STOP LIMIT', 'EXCHANGE STOP LIMIT'
]

statuses.forEach((s) => {
  Order.type[s] = s
  Order.status[s.split(' ').join('_')] = s
})

types.forEach((t) => {
  Order.type[t] = t
  Order.type[t.split(' ').join('_')] = t
})

module.exports = Order
