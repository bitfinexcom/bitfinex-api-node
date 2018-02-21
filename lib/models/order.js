'use strict'

const Promise = require('bluebird')
const Model = require('../model')
const BOOL_FIELDS = ['notify']
const FIELDS = {
  id: 0,
  gid: 1,
  cid: 2,
  symbol: 3,
  mtsCreate: 4,
  mtsUpdate: 5,
  amount: 6,
  amountOrig: 7,
  type: 8,
  typePrev: 9,
  flags: 12,
  status: 13,
  price: 16,
  priceAvg: 17,
  priceTrailing: 18,
  priceAuxLimit: 19,
  notify: 23,
  placedId: 25
}

const FIELD_KEYS = Object.keys(FIELDS)

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
  constructor (data = {}, ws) {
    super(data, FIELDS, BOOL_FIELDS, FIELD_KEYS)

    if (!this.flags) this.flags = 0
    if (typeof data.oco !== 'undefined') this.setOCO(data.oco)
    if (typeof data.hidden !== 'undefined') this.setHidden(data.hidden)
    if (typeof data.postonly !== 'undefined') this.setPostOnly(data.postonly)

    this._ws = ws
    this._lastAmount = this.amount

    this._onWSOrderNew = this._onWSOrderNew.bind(this)
    this._onWSOrderUpdate = this._onWSOrderUpdate.bind(this)
    this._onWSOrderClose = this._onWSOrderClose.bind(this)
  }

  static unserialize (arr) {
    return super.unserialize(arr, FIELDS, BOOL_FIELDS, FIELD_KEYS)
  }

  /**
   * @return {boolean} oco
   */
  isOCO () {
    return !!(this.flags & Order.flags.OCO)
  }

  /**
   * @return {boolean} hidden
   */
  isHidden () {
    return !!(this.flags & Order.flags.HIDDEN)
  }

  /**
   * @return {boolean} postonly
   */
  isPostOnly () {
    return !!(this.flags & Order.flags.POSTONLY)
  }

  /**
   * @param {boolean} v
   * @param {number?} stopPrice - optional, defaults to current value
   */
  setOCO (v, stopPrice = this.priceAuxLimit) {
    if (v) this.priceAuxLimit = stopPrice

    return this._modifyFlag(Order.flags.OCO, v)
  }

  /**
   * @param {boolean} v
   */
  setHidden (v) {
    return this._modifyFlag(Order.flags.HIDDEN, v)
  }

  /**
   * @param {boolean} v
   */
  setPostOnly (v) {
    return this._modifyFlag(Order.flags.POSTONLY, v)
  }

  _modifyFlag (flag, active) {
    if (!!(this.flags & flag) === active) return

    this.flags += active ? flag : -flag
  }

  /**
   * @return {Object} preview
   */
  toPreview () {
    return {
      gid: this.gid,
      cid: this.cid,
      symbol: this.symbol,
      amount: this.amount,
      type: this.type,
      price: this.price,
      notify: this.notify,
      flags: this.flags
    }
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

    this.emit('update', order, this)
  }

  /**
   * @param {Array} order
   * @private
   */
  _onWSOrderClose (order) {
    this._lastAmount = this.amount
    Object.assign(this, Order.unserialize(order))

    this.emit('close', order, this)
  }

  /**
   * @param {Array} order
   * @private
   */
  _onWSOrderNew (order) {
    this._lastAmount = this.amount
    Object.assign(this, Order.unserialize(order))

    this.emit('update', order, this)
  }

  /**
   * Creates an order map that can be passed to the `on` command.
   *
   * @return {Object} o
   */
  toNewOrderPacket () {
    const data = {
      gid: this.gid,
      cid: Number.isNaN(+this.cid) ? lastCID++ : this.cid,
      symbol: this.symbol,
      type: this.type,
      price: `${this.price}`,
      amount: `${this.amount}`,
      flags: this.flags || 0
    }

    if (!Number.isNaN(+this.priceTrailing)) {
      data.price_trailing = this.priceTrailing + ''
    }

    if (!Number.isNaN(+this.priceAuxLimit)) {
      data.price_aux_limit = this.priceAuxLimit + ''
    }

    return data
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

Order.flags = {
  OCO: 2 ** 14,      // 16384
  POSTONLY: 2 ** 12, // 4096
  HIDDEN: 2 ** 6,    // 64
  NO_VR: 2 ** 19     // 524288
}

module.exports = Order
