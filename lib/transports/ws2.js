'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws')
const crypto = require('crypto')
const WebSocket = require('ws')
const Promise = require('bluebird')
const CbQ = require('cbq')

const {
  BalanceInfo,
  FundingCredit,
  FundingInfo,
  FundingLoan,
  FundingOffer,
  FundingTrade,
  MarginInfo,
  Notification,
  Order,
  Position,
  Trade,
  Wallet
} = require('../models')

const WS_URL = 'wss://api.bitfinex.com/ws/2'
const INFO_CODES = {
  SERVER_RESTART: 20051,
  MAINTENANCE_START: 20060,
  MAINTENANCE_END: 20061
}

/**
 * Communicates with v2 of the Bitfinex WebSocket API
 */
class WSv2 extends EventEmitter {
  /**
   * @param {sting} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.url - ws connection url
   */
  constructor(opts = { apiKey: '', apiSecret: '', url: WS_URL }) {
    super()

    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._agent = opts.agent
    this._url = opts.url || WS_URL
    this._transform = opts.transform === true
    this._orderOpBufferDelay = opts.orderOpBufferDelay || -1
    this._orderOpBuffer = []
    this._orderOpTimeout = null

    /**
     * {
     *   [groupID]: {
     *     [eventName]: [{
     *       modelClass: ..,
     *       filter: { symbol: 'tBTCUSD' }, // only works w/ serialize
     *       cb: () => {}
     *     }]
     *   }
     * }
     */
    this._listeners = {}
    this._infoListeners = {} // { [code]: <listeners> }
    this._subscriptionRefs = {}
    this._channelMap = {}
    this._eventCallbacks = new CbQ()
    this._isAuthenticated = false
    this._isOpen = false
    this._ws = null

    this._onWSOpen = this._onWSOpen.bind(this)
    this._onWSClose = this._onWSClose.bind(this)
    this._onWSError = this._onWSError.bind(this)
    this._onWSMessage = this._onWSMessage.bind(this)
  }

  open() {
    if (this._isOpen || this._ws !== null) throw new Error('already open')

    this._ws = new WebSocket(this._url, {
      agent: this._agent
    })

    this._ws.on('message', this._onWSMessage)
    this._ws.on('open', this._onWSOpen)
    this._ws.on('error', this._onWSError)
    this._ws.on('close', this._onWSClose)
  }

  close(code, reason) {
    if (!this._isOpen || this._ws === null) throw new Error('not open')

    this._ws.close(code, reason)
  }

  auth (calc = 0) {
    if (this._isAuthenticated) throw new Error('already authenticated')

    const authNonce = Date.now() * 1000
    const authPayload = `AUTH${authNonce}${authNonce}`

    const authSig = crypto
      .createHmac('sha384', this._apiSecret)
      .update(authPayload)
      .digest('hex')

    this.send({
      event: 'auth',
      apiKey: this._apiKey,
      authSig,
      authPayload,
      authNonce,
      calc
    })
  }

  _onWSOpen() {
    this._isOpen = true
    this.emit('open')

    debug('connection open')
  }

  _onWSClose() {
    this._isOpen = false
    this._ws = null
    this.emit('close')

    debug('connection closed')
  }

  _onWSError(err) {
    this.emit('error', err)

    debug('error: %j', err)
  }

  _onWSNotification(arrN) {
    if (arrN[1] === 'on-req' && arrN[4]) {
      const status = arrN[6]
      const msg = arrN[7]
      const [,, cid] = arrN[4]
      const k = `order-${cid}`

      if (status === 'SUCCESS') {
        return this._eventCallbacks.trigger(k, null, arrN[4])
      }

      this._eventCallbacks.trigger(k, new Error(`${status}: ${msg}`), arrN[4])
    }
  }

  _onWSMessage(msgJSON, flags) {
    let msg

    try {
      msg = JSON.parse(msgJSON)
    } catch (e) {
      console.trace(`[bfx ws2 error] received invalid json: ${msgJSON}`)
      this.emit('error', `invalid message JSON: ${msgJSON}`)
      return
    }

    this.emit('message', msg, flags)

    if (msg.constructor.name === 'Array') {
      return this._handleChannelMessage(msg)
    } else if (msg.event) {
      return this._handleEventMessage(msg)
    } else {
      // for debugging during dev, TODO: remove/handle
      throw new Error(`unidentified message: ${JSON.stringify(msg)}`)
    }
  }

  /**
   * @param {array} msg 
   * @return {boolean} handled
   */
  _handleChannelMessage(msg) {
    const [chanId] = msg
    const channelData = this._channelMap[chanId]

    // TODO: emit error?
    if (!channelData) {
      debug('recv msg from unknown channel %d: %j', chanId, msg)
      return false
    }

    debug('recv msg: %j', msg)
    this.emit(channelData.channel, msg)

    if (msg.length < 2) return false
    if (msg[1] === 'hb') return false
    if (msg[1].constructor.name === 'Array') return false // TODO: handle snapshots

    if (msg[1] === 'n') { // fire order cbs if needed
      this._onWSNotification(msg[2])
    }

    const [, eventName, payload] = msg
    const listenerGroups = Object.values(this._listeners)

    let listeners
    let listener
    let filterPass
    let filterIndices

    // TODO: refactor/break up; this just forwards the payload to the relevant
    //       listeners, w/ transform & filter handling
    for (let i = 0; i < listenerGroups.length; i++) {
      listeners = listenerGroups[i]
      if (!listeners[eventName]) continue

      for (let j = 0; j < listeners[eventName].length; j++) {
        listener = listeners[eventName][j]
        filterPass = true

        if (listener.filter) {
          filterIndices = Object.keys(listener.filter)

          for (let k = 0; k < filterIndices.length; k++) {
            if (payload[+filterIndices[i]] !== listener.filter[filterIndices[i]]) {
              filterPass = false
              break
            }
          }
        }

        if (!filterPass) continue

        let finalPayload = payload

        if (this._transform && payload.length > 0) {
          if (payload[0].constructor.name === 'Array') {
            finalPayload = payload.map((data) => {
              return new listener.modelClass(data)
            })
          } else {
            finalPayload = new listener.modelClass(payload)
          }
        }

        listener.cb(finalPayload)
      }
    }

    return true
  }

  _handleEventMessage(msg) {
    if (msg.event === 'auth') {
      return this._handleAuthMessage(msg)
    } else if (msg.event === 'subscribed') {
      return this._handleSubscribedMessage(msg)
    } else if (msg.event === 'unsubscribed') {
      return this._handleUnsubscribedMessage(msg)
    } else if (msg.event === 'info') {
      return this._handleInfoMessage(msg)
    } else if (msg.event === 'conf') {
      return this._handleConfigMessage(msg)
    }

    debug('recv unknown event message: %j', msg)
    return null
  }

  _handleConfigMessage(msg) {
    if (msg.status !== 'OK') {
      debug('config failed: %j', msg)
      return this.emit('error', msg)
    }
  }

  _handleAuthMessage(msg) {
    if (msg.status !== 'OK') {
      debug('auth failed: %j', msg)
      return this.emit('error', msg)
    }

    this._channelMap[msg.chanId] = { channel: 'auth' }
    this._isAuthenticated = true

    this.emit('auth', msg)
    debug('authenticated!')
  }

  _handleSubscribedMessage(msg) {
    this._channelMap[msg.chanId] = msg

    debug('subscribed to %s [%d]', msg.channel, msg.chanId)
    this.emit('subscribed', msg)
  }

  _handleUnsubscribedMessage(msg) {
    delete this._channelMap[msg.chanId]

    debug('unsubscribed from %s [%d]', msg.channel, msg.chanId)
    this.emit('unsubscribed', msg)
  }

  _handleInfoMessage(msg) {
    if (msg.version) {
      if (msg.version !== 2) {
        const err = new Error(`server not running API v2: v${msg.version}`)

        this.emit('error', err)
        this.close()
        return
      } else {
        debug('server running API v2')
      }
    } else if (msg.code && this._infoListeners[msg.code]) {
      this._infoListeners[msg.code].forEach(cb => cb(msg))
    }

    this.emit('info', msg)
  }

  /**
   * Subscribes and tracks subscriptions per channel/identifier pair. If
   * already subscribed to the specified pair, nothing happens. If the ws
   * is not open, the new ref count persists & the packet is returned to be
   * buffered by the caller.
   *
   * @param {string} channel 
   * @param {string} identifier - for uniquely identifying the ref count
   * @param {Object} payload - merged with sub packet
   * @return {boolean} subSent
   */
  _managedSubscribe(channel = '', identifier = '', payload = {}) {
    const key = `${channel}:${identifier}`

    if (this._subscriptionRefs[key]) {
      this._subscriptionRefs[key]++
      return false
    }

    this._subscriptionRefs[key] = 1
    this.subscribe(channel, payload)

    return true
  }

  /**
   * @param {string} channel 
   * @param {string} identifier 
   * @return {boolean} unsubSent
   */
  _managedUnsubscribe(channel = '', identifier = '') {
    const key = `${channel}:${identifier}`
    const chanId = this._chanIdByIdentifier(channel, identifier)

    if (chanId === null || isNaN(this._subscriptionRefs[key])) return false

    this._subscriptionRefs[key]--
    if (this._subscriptionRefs[key] > 0) return false

    this.unsubscribe(chanId)
    delete this._subscriptionRefs[key]

    return true
  }

  _chanIdByIdentifier(channel, identifier) {
    const channelIds = Object.keys(this._channelMap)
    let chan

    for (let i = 0; i < channelIds.length; i++) {
      chan = this._channelMap[channelIds[i]]

      if (chan.channel === channel && (
        chan.symbol === identifier ||
        chan.key === identifier
      )) {
        return channelIds[i]
      }
    }

    return null
  }

  _getEventPromise(key) {
    return new Promise((resolve, reject) => {
      this._eventCallbacks.push(key, (err, res) => {
        if (err) {
          return reject(err)
        }

        resolve(res)
      })
    })
  }

  send(msg) {
    if (!this._ws) throw new Error('ws not open')

    debug('sending %j', msg)
    this._ws.send(JSON.stringify(msg))
  }

  enableSequencing() {
    this.send({
      event: 'conf',
      flags: 65536
    })
  }

  onServerRestart(cb) {
    this.onInfoMessage(WSv2.info.SERVER_RESTART, cb)
  }

  onMaintenanceStart(cb) {
    this.onInfoMessage(WSv2.info.MAINTENANCE_START, cb)
  }

  onMaintenanceEnd(cb) {
    this.onInfoMessage(WSv2.info.MAINTENANCE_END, cb)
  }

  subscribe(channel, payload) {
    this.send(Object.assign({
      event: 'subscribe',
      channel
    }, payload))
  }

  subscribeTicker(symbol) {
    return this._managedSubscribe('ticker', symbol, { symbol })
  }

  subscribeTrades(symbol) {
    return this._managedSubscribe('trades', symbol, { symbol })
  }

  subscribeOrderBook(symbol, prec = 'P0', len = '25') {
    return this._managedSubscribe('book', symbol, { len, prec })
  }

  subscribeCandles(symbol, frame) {
    const key = `trade:${frame}:${symbol}`

    return this._managedSubscribe('candles', key, { key })
  }

  unsubscribe(chanId) {
    this.send({
      event: 'unsubscribe',
      chanId: +chanId
    })
  }

  unsubscribeTicker(symbol) {
    return this._managedUnsubscribe('ticker', symbol)
  }

  unsubscribeTrades(symbol) {
    return this._managedUnsubscribe('trades', symbol)
  }

  unsubscribeOrderBook(symbol, prec = 'P0', len = '25') {
    return this._managedUnsubscribe('book', symbol)
  }

  unsubscribeCandles(symbol, frame) {
    return this._managedUnsubscribe('candles', `trade:${frame}:${symbol}`)
  }

  removeListeners(cbGID) {
    delete this._listeners[cbGID]
  }

  // Throttle to 8 op/s
  requestCalc() {
    throw new Error('unimplemented') // TODO
  }

  // Object or array
  submitOrder(order) {
    if (!this._isAuthenticated) throw new Error('not authenticated')

    const packet = order.constructor.name === 'Array'
      ? order
      : order.constructor.name === 'Order'
        ? order.toNewOrderPacket()
        : new Order(order).toNewOrderPacket()

    this._sendOrderPacket([0, 'on', null, packet])

    return this._getEventPromise(`order-${packet.cid}`)
  }

  // Object, array, or ID
  cancelOrder(orderOrID) {
    if (!this._isAuthenticated) throw new Error('not authenticated')

    const id = typeof orderOrID === 'number'
      ? orderOrID
      : orderOrID.constructor.name === 'Array'
        ? orderOrID[0]
        : orderOrID.id

    debug(`cancelling order ${id}`)
    this._sendOrderPacket([0, 'oc', null, { id }])

    return this._getEventPromise(`order-cancel-${id}`)
  }

  // <Object, array, or ID>
  cancelOrders(ordersOrIDs) {
    if (!this._isAuthenticated) throw new Error('not authenticated')

    return Promise.all(ordersOrIDs.map((order) => {
      return this.cancelOrder(order)
    }))
  }

  submitOrderMultiOp(opPayloads) {
    if (!this._isAuthenticated) throw new Error('not authenticated')

    this.send([0, 'ox_multi', null, opPayloads])
  }

  _sendOrderPacket(packet) {
    if (this._hasOrderBuff()) {
      this._ensureOrderBuffTimeout()
      this._orderOpBuffer.push(packet)
    } else {
      this.send(packet)
    }
  }

  _hasOrderBuff() {
    return this._orderOpBufferDelay > 0
  }

  _ensureOrderBuffTimeout() {
    if (this._orderOpTimeout !== null) return

    this._orderOpTimeout = setTimeout(
      this._flushOrderOps.bind(this),
      this._orderOpBufferDelay
    )
  }

  _flushOrderOps() {
    this._orderOpTimeout = null

    const packets = this._orderOpBuffer.map(p => [p[1], p[3]])
    this._orderOpBuffer = []

    return this.submitOrderMultiOp(packets)
  }

  isAuthenticated() {
    return this._isAuthenticated
  }

  isOpen() {
    return this._isOpen
  }

  /**
   * Adds a listener to the internal listener set, with an optional grouping
   * for batch unsubscribes (GID) & automatic ws packet matching (filterKey)
   *
   * @param {string} eventName - as received on ws stream
   * @param {number} fIndex - index in arr payload to filter for
   * @param {*} fValue - actual value to match filter against
   * @param {object} modelClass - model to use for serialization
   * @param {string} cbGID - listener group ID for mass removal
   * @param {method} cb - listener
   */
  _registerListener(eventName, fIndex, fValue, modelClass, cbGID, cb) {
    if (!this._listeners[cbGID]) {
      this._listeners[cbGID] = {}
    }

    const listeners = this._listeners[cbGID]

    if (!listeners[eventName]) {
      listeners[eventName] = []
    }

    const l = {
      cb,
      modelClass
    }

    if (fIndex !== null && fValue) {
      l.filter = {
        [`${fIndex}`]: fValue
      }
    }

    listeners[eventName].push(l)
  }

  /**
   * Registers a new callback to be called when a matching info message is
   * received.
   *
   * @param {number} code - from WSv2.info.*
   * @param {method} cb
   */
  onInfoMessage(code, cb) {
    if(!this._infoListeners[code]) {
      this._infoListeners[code] = []
    }

    this._infoListeners[code].push(cb)
  }

  // The methods below could be set dynamically from a hashmap in the
  // constructor, but then we wouldn't get autocomplete, static analysis & co
  // Utility over aesthetics in this case. Also documentation (TODO)
  //
  // NOTE: Filters only work w/ transform: true, and are ignored otherwise

  onOrderSnapshot({ symbol, cbGID }, cb) {
    this._registerListener('os', 3, symbol, Order, cbGID, cb)
  }

  onOrderNew({ symbol, cbGID }, cb) {
    this._registerListener('on', 3, symbol, Order, cbGID, cb)
  }

  onOrderUpdate({ symbol, cbGID }, cb) {
    this._registerListener('ou', 3, symbol, Order, cbGID, cb)
  }

  onOrderClose({ symbol, cbGID }, cb) {
    this._registerListener('oc', 3, symbol, Order, cbGID, cb)
  }

  onPositionSnapshot({ symbol, cbGID }, cb) {
    this._registerListener('ps', 0, symbol, Position, cbGID, cb)
  }

  onPositionNew({ symbol, cbGID }, cb) {
    this._registerListener('pn', 0, symbol, Position, cbGID, cb)
  }

  onPositionUpdate({ symbol, cbGID }, cb) {
    this._registerListener('pu', 0, symbol, Position, cbGID, cb)
  }

  onPositionClose({ symbol, cbGID }, cb) {
    this._registerListener('pc', 0, symbol, Position, cbGID, cb)
  }

  onTradeEntry({ pair, cbGID }, cb) {
    this._registerListener('te', 1, pair, Trade, cbGID, cb)
  }

  onTradeUpdate({ pair, cbGID }, cb) {
    this._registerListener('tu', 1, pair, Trade, cbGID, cb)
  }

  onFundingOfferSnapshot({ symbol, cbGID }, cb) {
    this._registerListener('fos', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingOfferNew({ symbol, cbGID }, cb) {
    this._registerListener('fon', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingOfferUpdate({ symbol, cbGID }, cb) {
    this._registerListener('fou', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingOfferClose({ symbol, cbGID }, cb) {
    this._registerListener('foc', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingCreditSnapshot({ symbol, cbGID }, cb) {
    this._registerListener('fcs', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingCreditNew({ symbol, cbGID }, cb) {
    this._registerListener('fcn', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingCreditUpdate({ symbol, cbGID }, cb) {
    this._registerListener('fcu', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingCreditClose({ symbol, cbGID }, cb) {
    this._registerListener('fcc', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingLoanSnapshot({ symbol, cbGID }, cb) {
    this._registerListener('fls', 1, symbol, FundingLoan, cbGID, cb)
  }

  onFundingLoanNew({ symbol, cbGID }, cb) {
    this._registerListener('fln', 1, symbol, FundingLoan, cbGID, cb)
  }

  onFundingLoanUpdate({ symbol, cbGID }, cb) {
    this._registerListener('flu', 1, symbol, FundingLoan, cbGID, cb)
  }

  onFundingLoanClose({ symbol, cbGID }, cb) {
    this._registerListener('flc', 1, symbol, FundingLoan, cbGID, cb)
  }

  onWalletSnapshot({ cbGID }, cb) {
    this._registerListener('ws', null, null, Wallet, cbGID, cb)
  }

  onWalletUpdate({ cbGID }, cb) {
    this._registerListener('wu', null, null, Wallet, cbGID, cb)
  }

  onBalanceInfoUpdate({ cbGID }, cb) {
    this._registerListener('bu', null, null, BalanceInfo, cbGID, cb)
  }

  onMarginInfoUpdate({ cbGID }, cb) {
    this._registerListener('miu', null, null, MarginInfo, cbGID, cb)
  }

  onFundingInfoUpdate({ cbGID }, cb) {
    this._registerListener('fiu', null, null, FundingInfo, cbGID, cb)
  }

  onFundingTradeEntry({ symbol, cbGID }, cb) {
    this._registerListener('fte', 1, symbol, FundingTrade, cbGID, cb)
  }

  onFundingTradeUpdate({ symbol, cbGID }, cb) {
    this._registerListener('ftu', 1, symbol, FundingTrade, cbGID, cb)
  }

  onNotification({ type, cbGID }, cb) {
    this._registerListener('n', 1, type, Notification, cbGID, cb)
  }
}

WSv2.info = INFO_CODES

module.exports = WSv2
