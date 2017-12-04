'use strict'

const Promise = require('bluebird')
const Model = require('../model')
let lastCID = Date.now()

class Order extends Model {
  constructor(data, transport) {
    super(data)

    this._onTransportUpdate = this._onTransportUpdate.bind(this)
    this._onTransportClose = this._onTransportClose.bind(this)

    if (transport) {
      transport.onOrderUpdate(this.symbol, this.gid, this._onTransportUpdate)
      transport.onOrderClose(this.symbol, this.gid, this._onTransportClose)
    }

    this._transport = transport
  }

  submit() {
    if (!this._transport) return Promise.reject('no transport')

    return this._transport.submitOrder(this)
  }

  _onTransportUpdate(order) {
    if (order[2] !== this.cid) return

    Object.assign(this, Order.unserialize(order))
  }

  _onTransportClose(order) {
    if (order[2] !== this.cid) return

    Object.assign(this, Order.unserialize(order))
  }

  serialize() {
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

  toNewOrderPacket() {
    return {
      gid: this.gid,
      cid: this.cid || lastCID++,
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

  static unserialize(arr) {
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
}

Order.type = {}
Order.status = {}

const statuses = ['ACTIVE', 'EXECUTED', 'PARTIALLY FILLED', 'CANCELLED']
const types = [
  'MARKET', 'EXCHANGE MARKET', 'LIMIT', 'EXCHANGE LIMIT', 'STOP',
  'EXCHANGE STOP', 'TRAILING STOP', 'EXCHANGE TRAILING STOP', 'FOK',
  'EXCHANGE FOK', 'STOP LIMIT', 'EXCHANGE STOP LIMIT'
]

statuses.forEach(s => Order.status[s] = s)
types.forEach(t => Order.type[t] = t)

module.exports = Order
