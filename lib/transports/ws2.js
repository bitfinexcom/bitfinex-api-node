'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws')
const crypto = require('crypto')
const WebSocket = require('ws')
const Promise = require('bluebird')
const CbQ = require('cbq')
const { genAuthSig } = require('../util')

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
   * Instantiate a new ws2 transport. Does not auto-open
   *
   * @param {sting} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.url - ws connection url
   * @param {number} opts.orderOpBufferDelay - multi-order op batching timeout
   * @param {boolean} opts.transform - if true, packets are converted to models
   * @param {Object} opts.agent - optional node agent for ws connection (proxy)
   */
  constructor (opts = { apiKey: '', apiSecret: '', url: WS_URL }) {
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
    this._wasEverAuthenticated = false // used for auto-auth on reconnect
    this._isOpen = false
    this._ws = null

    this._onWSOpen = this._onWSOpen.bind(this)
    this._onWSClose = this._onWSClose.bind(this)
    this._onWSError = this._onWSError.bind(this)
    this._onWSMessage = this._onWSMessage.bind(this)
  }

  /**
   * Creates internal WS client; if it already exists, an error is emitted
   *
   * Listen for an 'open' event to be notified of completion
   */
  open () {
    if (this._isOpen || this._ws !== null) {
      return this.emit('error', new Error('already open'))
    }

    this._ws = new WebSocket(this._url, {
      agent: this._agent
    })

    this._ws.on('message', this._onWSMessage)
    this._ws.on('open', this._onWSOpen)
    this._ws.on('error', this._onWSError)
    this._ws.on('close', this._onWSClose)
  }

  /**
   * Closes the internal WS client; if it is not open, an error is emitted
   *
   * @param {number} code - passed to ws
   * @param {string} reason - passed to ws
   */
  close (code, reason) {
    if (!this._isOpen || this._ws === null) {
      return this.emit('error', new Error('not open'))
    }

    this._ws.close(code, reason)
  }

  /**
   * Generates & sends an authentication packet to the server; if already
   * authenticated, an error is emitted
   *
   * @param {number} calc - optional, default is 0
   */
  auth (calc = 0) {
    if (this._isAuthenticated) {
      return this.emit('error', new Error('already authenticated'))
    }

    const authNonce = Date.now() * 1000
    const authPayload = `AUTH${authNonce}${authNonce}`
    const { sig } = genAuthSig(this._apiSecret, authPayload)

    this.send({
      event: 'auth',
      apiKey: this._apiKey,
      authSig: sig,
      authPayload,
      authNonce,
      calc
    })
  }

  /**
   * Utility method to close & re-open the ws connection. Re-authenticates if
   * we were previously authenticated
   */
  reconnect () {
    if (this._isOpen) {
      this._ws.once('close', () => {
        setImmediate(this.reconnect.bind(this))
      })

      return this.close()
    }

    this.open()

    if (this._wasEverAuthenticated) {
      this._ws.once('open', this.auth.bind(this))
    }
  }

  /**
   * @private
   */
  _onWSOpen () {
    this._isOpen = true
    this.emit('open')

    debug('connection open')
  }

  /**
   * @private
   */
  _onWSClose () {
    this._isOpen = false
    this._isAuthenticated = false
    this._ws = null
    this.emit('close')

    debug('connection closed')
  }

  /**
   * @private
   */
  _onWSError (err) {
    this.emit('error', err)

    debug('error: %j', err)
  }

  /**
   * @param {Array} arrN - notification in ws array format
   * @private
   */
  _onWSNotification (arrN) {
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

  /**
   * @param {string} msgJSON
   * @param {string} flags
   * @private
   */
  _onWSMessage (msgJSON, flags) {
    let msg

    try {
      msg = JSON.parse(msgJSON)
    } catch (e) {
      console.trace(`[bfx ws2 error] received invalid json: ${msgJSON}`)
      this.emit('error', `invalid message JSON: ${msgJSON}`)
      return
    }

    this.emit('message', msg, flags)

    if (Array.isArray(msg)) {
      return this._handleChannelMessage(msg)
    } else if (msg.event) {
      return this._handleEventMessage(msg)
    } else {
      debug('recv unidentified message: %j', msg)
    }
  }

  /**
   * @param {array} msg
   * @return {boolean} handled
   * @private
   */
  _handleChannelMessage (msg) {
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
    if (Array.isArray(msg[1])) return false // TODO: handle snapshots

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

      // Handle catch-all listeners (no transform support)
      if (listeners['']) {
        for (let j = 0; j < listeners[''].length; j++) {
          listeners[''][j].cb(payload)
        }
      }

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
          if (Array.isArray(payload[0])) {
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

  /**
   * @param {Object} msg
   * @private
   */
  _handleEventMessage (msg) {
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

  /**
   * @param {Object} msg
   * @private
   */
  _handleConfigMessage (msg) {
    if (msg.status !== 'OK') {
      debug('config failed: %j', msg)
      return this.emit('error', msg)
    }
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleAuthMessage (msg) {
    if (msg.status !== 'OK') {
      debug('auth failed: %j', msg)
      return this.emit('error', msg)
    }

    this._channelMap[msg.chanId] = { channel: 'auth' }
    this._isAuthenticated = true
    this._wasEverAuthenticated = true

    this.emit('auth', msg)
    debug('authenticated!')
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleSubscribedMessage (msg) {
    this._channelMap[msg.chanId] = msg

    debug('subscribed to %s [%d]', msg.channel, msg.chanId)
    this.emit('subscribed', msg)
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleUnsubscribedMessage (msg) {
    delete this._channelMap[msg.chanId]

    debug('unsubscribed from %s [%d]', msg.channel, msg.chanId)
    this.emit('unsubscribed', msg)
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleInfoMessage (msg) {
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
  managedSubscribe (channel = '', identifier = '', payload = {}) {
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
  managedUnsubscribe (channel = '', identifier = '') {
    const key = `${channel}:${identifier}`
    const chanId = this._chanIdByIdentifier(channel, identifier)

    if (chanId === null || isNaN(this._subscriptionRefs[key])) return false

    this._subscriptionRefs[key]--
    if (this._subscriptionRefs[key] > 0) return false

    this.unsubscribe(chanId)
    delete this._subscriptionRefs[key]

    return true
  }

  /**
   * @param {string} channel
   * @param {string} identifier
   * @private
   */
  _chanIdByIdentifier (channel, identifier) {
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

  /**
   * @param {string} key
   * @private
   */
  _getEventPromise (key) {
    return new Promise((resolve, reject) => {
      this._eventCallbacks.push(key, (err, res) => {
        if (err) {
          return reject(err)
        }

        resolve(res)
      })
    })
  }

  /**
   * Send a packet to the WS server
   *
   * @param {*} msg - packet, gets stringified
   */
  send (msg) {
    if (!this._ws) {
      return this.emit('error', new Error('ws not open'))
    }

    debug('sending %j', msg)
    this._ws.send(JSON.stringify(msg))
  }

  /**
   * Configures the seq flag to enable sequencing (packet number) for this
   * connection. When enabled, the seq number will be the last value of
   * channel packet arrays.
   */
  enableSequencing () {
    this.send({
      event: 'conf',
      flags: 65536
    })
  }

  /**
   * Register a callback in case of a ws server restart message; Use this to
   * call reconnect() if needed. (code 20051)
   *
   * @param {method} cb
   */
  onServerRestart (cb) {
    this.onInfoMessage(WSv2.info.SERVER_RESTART, cb)
  }

  /**
   * Register a callback in case of a 'maintenance started' message from the
   * server. This is a good time to pause server packets until maintenance ends
   *
   * @param {method} cb
   */
  onMaintenanceStart (cb) {
    this.onInfoMessage(WSv2.info.MAINTENANCE_START, cb)
  }

  /**
   * Register a callback to be notified of a maintenance period ending
   *
   * @param {method} cb
   */
  onMaintenanceEnd (cb) {
    this.onInfoMessage(WSv2.info.MAINTENANCE_END, cb)
  }

  /**
   * @param {string} channel
   * @param {Object} payload - optional
   */
  subscribe (channel, payload) {
    this.send(Object.assign({
      event: 'subscribe',
      channel
    }, payload))
  }

  /**
   * @param {string} symbol
   */
  subscribeTicker (symbol) {
    return this.managedSubscribe('ticker', symbol, { symbol })
  }

  /**
   * @param {string} symbol
   */
  subscribeTrades (symbol) {
    return this.managedSubscribe('trades', symbol, { symbol })
  }

  /**
   * @param {string} symbol
   * @param {string} prec - P0, P1, P2, or P3 (default P0)
   * @param {string} len - 25 or 100 (default 25)
   */
  subscribeOrderBook (symbol, prec = 'P0', len = '25') {
    return this.managedSubscribe('book', symbol, { len, prec })
  }

  /**
   * @param {string} symbol
   * @param {string} frame - time frame
   */
  subscribeCandles (symbol, frame) {
    const key = `trade:${frame}:${symbol}`

    return this.managedSubscribe('candles', key, { key })
  }

  /**
   * @param {number} chanId
   */
  unsubscribe (chanId) {
    this.send({
      event: 'unsubscribe',
      chanId: +chanId
    })
  }

  /**
   * @param {string} symbol
   */
  unsubscribeTicker (symbol) {
    return this.managedUnsubscribe('ticker', symbol)
  }

  /**
   * @param {string} symbol
   */
  unsubscribeTrades (symbol) {
    return this.managedUnsubscribe('trades', symbol)
  }

  /**
   * @param {string} symbol
   * @param {string} prec - P0, P1, P2, or P3 (default P0)
   * @param {string} len - 25 or 100 (default 25)
   */
  unsubscribeOrderBook (symbol, prec = 'P0', len = '25') {
    return this.managedUnsubscribe('book', symbol)
  }

  /**
   * @param {string} symbol
   * @param {string} frame - time frame
   */
  unsubscribeCandles (symbol, frame) {
    return this.managedUnsubscribe('candles', `trade:${frame}:${symbol}`)
  }

  /**
   * @param {string} cbGID
   */
  removeListeners (cbGID) {
    delete this._listeners[cbGID]
  }

  // Throttle to 8 op/s
  requestCalc () {
    throw new Error('unimplemented') // TODO
  }

  /**
   * @param {Object|Array} order
   * @return {Promise} p
   */
  submitOrder (order) {
    if (!this._isAuthenticated) {
      return Promise.reject(new Error('not authenticated'))
    }

    const packet = Array.isArray(order)
      ? order
      : order instanceof Order
        ? order.toNewOrderPacket()
        : new Order(order).toNewOrderPacket()

    this._sendOrderPacket([0, 'on', null, packet])

    return this._getEventPromise(`order-${packet.cid}`)
  }

  /**
   * @param {Object|Array|number} order
   */
  cancelOrder (order) {
    if (!this._isAuthenticated) {
      return Promise.reject(new Error('not authenticated'))
    }

    const id = typeof order === 'number'
      ? order
      : Array.isArray(order)
        ? order[0]
        : order.id

    debug(`cancelling order ${id}`)
    this._sendOrderPacket([0, 'oc', null, { id }])

    return this._getEventPromise(`order-cancel-${id}`)
  }

  /**
   * @param {Object[]|Array[]|number[]} orders
   */
  cancelOrders (orders) {
    if (!this._isAuthenticated) {
      return Promise.reject(new Error('not authenticated'))
    }

    return Promise.all(orders.map((order) => {
      return this.cancelOrder(order)
    }))
  }

  /**
   * @param {Object[]} opPayloads
   */
  submitOrderMultiOp (opPayloads) {
    if (!this._isAuthenticated) {
      return Promise.reject(new Error('not authenticated'))
    }

    this.send([0, 'ox_multi', null, opPayloads])
  }

  /**
   * @param {array} packet
   * @private
   */
  _sendOrderPacket (packet) {
    if (this._hasOrderBuff()) {
      this._ensureOrderBuffTimeout()
      this._orderOpBuffer.push(packet)
    } else {
      this.send(packet)
    }
  }

  /**
   * @return {boolean} buffEnabled
   * @private
   */
  _hasOrderBuff () {
    return this._orderOpBufferDelay > 0
  }

  /**
   * @private
   */
  _ensureOrderBuffTimeout () {
    if (this._orderOpTimeout !== null) return

    this._orderOpTimeout = setTimeout(
      this._flushOrderOps.bind(this),
      this._orderOpBufferDelay
    )
  }

  /**
   * @private
   */
  _flushOrderOps () {
    this._orderOpTimeout = null

    const packets = this._orderOpBuffer.map(p => [p[1], p[3]])
    this._orderOpBuffer = []

    return this.submitOrderMultiOp(packets)
  }

  /**
   * @return {boolean} authenticated
   */
  isAuthenticated () {
    return this._isAuthenticated
  }

  /**
   * @return {boolean} open
   */
  isOpen () {
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
   * @private
   */
  _registerListener (eventName, fIndex, fValue, modelClass, cbGID, cb) {
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
  onInfoMessage (code, cb) {
    if (!this._infoListeners[code]) {
      this._infoListeners[code] = []
    }

    this._infoListeners[code].push(cb)
  }

  onMessage({ cbGID }, cb) {
    this._registerListener('', null, null, null, cbGID, cb)
  }

  onOrderSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('os', 3, symbol, Order, cbGID, cb)
  }

  onOrderNew ({ symbol, cbGID }, cb) {
    this._registerListener('on', 3, symbol, Order, cbGID, cb)
  }

  onOrderUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('ou', 3, symbol, Order, cbGID, cb)
  }

  onOrderClose ({ symbol, cbGID }, cb) {
    this._registerListener('oc', 3, symbol, Order, cbGID, cb)
  }

  onPositionSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('ps', 0, symbol, Position, cbGID, cb)
  }

  onPositionNew ({ symbol, cbGID }, cb) {
    this._registerListener('pn', 0, symbol, Position, cbGID, cb)
  }

  onPositionUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('pu', 0, symbol, Position, cbGID, cb)
  }

  onPositionClose ({ symbol, cbGID }, cb) {
    this._registerListener('pc', 0, symbol, Position, cbGID, cb)
  }

  onTradeEntry ({ pair, cbGID }, cb) {
    this._registerListener('te', 1, pair, Trade, cbGID, cb)
  }

  onTradeUpdate ({ pair, cbGID }, cb) {
    this._registerListener('tu', 1, pair, Trade, cbGID, cb)
  }

  onFundingOfferSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('fos', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingOfferNew ({ symbol, cbGID }, cb) {
    this._registerListener('fon', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingOfferUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('fou', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingOfferClose ({ symbol, cbGID }, cb) {
    this._registerListener('foc', 1, symbol, FundingOffer, cbGID, cb)
  }

  onFundingCreditSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('fcs', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingCreditNew ({ symbol, cbGID }, cb) {
    this._registerListener('fcn', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingCreditUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('fcu', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingCreditClose ({ symbol, cbGID }, cb) {
    this._registerListener('fcc', 1, symbol, FundingCredit, cbGID, cb)
  }

  onFundingLoanSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('fls', 1, symbol, FundingLoan, cbGID, cb)
  }

  onFundingLoanNew ({ symbol, cbGID }, cb) {
    this._registerListener('fln', 1, symbol, FundingLoan, cbGID, cb)
  }

  onFundingLoanUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('flu', 1, symbol, FundingLoan, cbGID, cb)
  }

  onFundingLoanClose ({ symbol, cbGID }, cb) {
    this._registerListener('flc', 1, symbol, FundingLoan, cbGID, cb)
  }

  onWalletSnapshot ({ cbGID }, cb) {
    this._registerListener('ws', null, null, Wallet, cbGID, cb)
  }

  onWalletUpdate ({ cbGID }, cb) {
    this._registerListener('wu', null, null, Wallet, cbGID, cb)
  }

  onBalanceInfoUpdate ({ cbGID }, cb) {
    this._registerListener('bu', null, null, BalanceInfo, cbGID, cb)
  }

  onMarginInfoUpdate ({ cbGID }, cb) {
    this._registerListener('miu', null, null, MarginInfo, cbGID, cb)
  }

  onFundingInfoUpdate ({ cbGID }, cb) {
    this._registerListener('fiu', null, null, FundingInfo, cbGID, cb)
  }

  onFundingTradeEntry ({ symbol, cbGID }, cb) {
    this._registerListener('fte', 1, symbol, FundingTrade, cbGID, cb)
  }

  onFundingTradeUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('ftu', 1, symbol, FundingTrade, cbGID, cb)
  }

  onNotification ({ type, cbGID }, cb) {
    this._registerListener('n', 1, type, Notification, cbGID, cb)
  }
}

WSv2.info = INFO_CODES

module.exports = WSv2
