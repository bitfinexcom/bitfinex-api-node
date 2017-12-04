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

class WSv2 extends EventEmitter {

  constructor(args = {}) {
    super()

    this._apiKey = args.apiKey || ''
    this._apiSecret = args.apiSecret || ''
    this._agent = args.agent
    this._wsURL = args.url || 'wss://api.bitfinex.com/ws/2'
    this._transform = args.transform === true
    this._orderOpBufferDelay = args.orderOpBufferDelay || -1
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

    this._ws = new WebSocket(this._wsURL, {
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
        this._eventCallbacks.trigger(k, null, arrN[4])
      } else {
        this._eventCallbacks.trigger(k, new Error(`${status}: ${msg}`), arrN[4])
      }
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
    let filterKeys
    let filterPass

    // TODO: refactor/break up; this just forwards the payload to the relevant
    //       listeners, w/ transform & filter handling
    for (let i = 0; i < listenerGroups.length; i++) {
      listeners = listenerGroups[i]
      if (!listeners[eventName]) continue

      for (let j = 0; j < listeners[eventName].length; j++) {
        listener = listeners[eventName][j]

        if (this._transform && listener.filter) { // TODO: transform
          filterPass = true
          filterKeys = Object.keys(listener.filter)

          for (let k = 0; k < filterKeys.length; k++) {
            if (payload[filterKeys[k]] !== listener.filter[filterKeys[k]]) {
              filterPass = false
              break
            }
          }

          if (!filterPass) continue
        }

        let finalPayload 

        if (this._transform && payload.length > 0) {
          if (payload[0].constructor.name === 'Array') {
            finalPayload = payload.map((data) => {
              return new listener.modelClass(data)
            })
          } else {
            finalPayload = new listener.modelClass(payload)
          }
        } else {
          finalPayload = payload
        }

        listener.cb(payload)
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
    } else {
      // for debugging during dev, TODO: remove/handle
      throw new Error(`unidentified event message: ${JSON.stringify(msg)}`)
    }

    return null
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
  }

  _handleUnsubscribedMessage(msg) {
    delete this._channelMap[msg.chanId]

    debug('unsubscribed from %s [%d]', msg.channel, msg.chanId)
  }

  _handleInfoMessage(msg) {
    if (msg.version !== 2) {
      throw new Error(`server not running API v2: got v${msg.version}`)
    }

    debug('server running API v2')
  }

  /**
   * Subscribes and tracks subscriptions per channel/identifier pair. If
   * already subscribed to the specified pair, nothing happens. If the ws
   * is not open, the new ref count persists & the packet is returned to be
   * buffered by the caller.
   *
   * @param {string} channel 
   * @param {string} identifier for uniquely identifying the ref count
   * @param {Object} payload merged with sub packet
   * @return {boolean|Object} statusOrPacket if not open, the packet is returned
   */
  _managedSubscribe(channel = '', identifier = '', payload = {}) {
    const key = `${channel}:${identifier}`

    if (this._subscriptionRefs[key]) {
      this._subscriptionRefs[key]++
      return false
    }

    this._subscriptionRefs[key] = 1

    const packet = Object.assign({
      event: 'subscribe',
      channel
    }, payload)

    if (!this._isOpen) return packet
    this._ws.send(JSON.stringify(packet))

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
    debug('sending %j', msg)
    this._ws.send(JSON.stringify(msg))
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
      chanId
    })
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
   * @param {string} filterKey - key on payload to filter w/ value passed to on*
   * @param {object} modelClass - model to use for serialization
   * @param {array} args - as passed to original on* method
   */
  _registerListenerFromCall(eventName, filterKey, modelClass, args) {
    const { cb, cbGID, filter } = WSv2.parseListenerRegArgs(filterKey, args)

    if (!this._listeners[cbGID]) {
      this._listeners[cbGID] = {}
    }

    const listeners = this._listeners[cbGID]

    if (!listeners[eventName]) {
      listeners[eventName] = []
    }

    listeners[eventName].push({ filter, cb, modelClass })
  }

  /**
   * Utility for on* methods to allow calling with multiple signatures;
   * specifically, (cb), (filter, cb) if on* method supports filtering,
   * (cbGID, cb), or (filter, cbGID, cb)
   *
   * @param {string} filterKey - name of key to filter packets by for listener
   * @param {array} args - as passed to original on* method
   */
  static parseListenerRegArgs(filterKey, args) {
    if (args.length === 0 || args.length > 3) {
      throw new Error('invalid on* method call')
    }

    const data = {
      cb: args[args.length - 1]
    }

    if (args.length === 1) {
      return data
    } else if (args.length === 2) {
      if (filterKey) {
        data.filter = {
          [filterKey]: args[0]
        }
      } else {
        data.cbGID = args[0]
      }
    } else {
      data.cbGID = args[1]

      if (filterKey) {
        data.filter = {
          [filterKey]: args[0]
        }
      }
    }

    return data
  }

  // The methods below could be set dynamically from a hashmap in the
  // constructor, but then we wouldn't get autocomplete, static analysis & co
  // Utility over aesthetics in this case. Also documentation (TODO)
  //
  // NOTE: Filters only work w/ transform: true, and are ignored otherwise

  onOrderSnapshot(symbol, cbGID, cb) {
    this._registerListenerFromCall('os', 'symbol', Order, arguments)
  }

  onOrderNew(symbol, cbGID, cb) {
    this._registerListenerFromCall('on', 'symbol', Order, arguments)
  }

  onOrderUpdate(symbol, cbGID, cb) {
    this._registerListenerFromCall('ou', 'symbol', Order, arguments)
  }

  onOrderClose(symbol, cbGID, cb) {
    this._registerListenerFromCall('oc', 'symbol', Order, arguments)
  }

  onPositionSnapshot(symbol, cbGID, cb) {
    this._registerListenerFromCall('ps', 'symbol', Position, arguments)
  }

  onPositionNew(symbol, cbGID, cb) {
    this._registerListenerFromCall('pn', 'symbol', Position, arguments)
  }

  onPositionUpdate(symbol, cbGID, cb) {
    this._registerListenerFromCall('pu', 'symbol', Position, arguments)
  }

  onPositionClose(symbol, cbGID, cb) {
    this._registerListenerFromCall('pc', 'symbol', Position, arguments)
  }

  onTradeEntry(pair, cbGID, cb) {
    this._registerListenerFromCall('te', 'pair', Trade, arguments)
  }

  onTradeUpdate(pair, cbGID, cb) {
    this._registerListenerFromCall('tu', 'pair', Trade, arguments)
  }

  onFundingOfferSnapshot(symbol, cbGID, cb) {
    this._registerListenerFromCall('fos', 'symbol', FundingOffer, arguments)
  }

  onFundingOfferNew(symbol, cbGID, cb) {
    this._registerListenerFromCall('fon', 'symbol', FundingOffer, arguments)
  }

  onFundingOfferUpdate(symbol, cbGID, cb) {
    this._registerListenerFromCall('fou', 'symbol', FundingOffer, arguments)
  }

  onFundingOfferClose(symbol, cbGID, cb) {
    this._registerListenerFromCall('foc', 'symbol', FundingOffer, arguments)
  }

  onFundingCreditSnapshot(symbol, cbGID, cb) {
    this._registerListenerFromCall('fcs', 'symbol', FundingCredit, arguments)
  }

  onFundingCreditNew(symbol, cbGID, cb) {
    this._registerListenerFromCall('fcn', 'symbol', FundingCredit, arguments)
  }

  onFundingCreditUpdate(symbol, cbGID, cb) {
    this._registerListenerFromCall('fcu', 'symbol', FundingCredit, arguments)
  }

  onFundingCreditClose(symbol, cbGID, cb) {
    this._registerListenerFromCall('fcc', 'symbol', FundingCredit, arguments)
  }

  onFundingLoanSnapshot(symbol, cbGID, cb) {
    this._registerListenerFromCall('fls', 'symbol', FundingLoan, arguments)
  }

  onFundingLoanNew(symbol, cbGID, cb) {
    this._registerListenerFromCall('fln', 'symbol', FundingLoan, arguments)
  }

  onFundingLoanUpdate(symbol, cbGID, cb) {
    this._registerListenerFromCall('flu', 'symbol', FundingLoan, arguments)
  }

  onFundingLoanClose(symbol, cbGID, cb) {
    this._registerListenerFromCall('flc', 'symbol', FundingLoan, arguments)
  }

  onWalletSnapshot(cgGID, cb) {
    this._registerListenerFromCall('ws', null, Wallet, arguments)
  }

  onWalletUpdate(cgGID, cb) {
    this._registerListenerFromCall('wu', null, Wallet, arguments)
  }

  onBalanceInfoUpdate(cgGID, cb) {
    this._registerListenerFromCall('bu', null, BalanceInfo, arguments)
  }

  onMarginInfoUpdate(cgGID, cb) {
    this._registerListenerFromCall('miu', null, MarginInfo, arguments)
  }

  onFundingInfoUpdate(cgGID, cb) {
    this._registerListenerFromCall('fiu', null, FundingInfo, arguments)
  }

  onFundingTradeEntry(symbol, cgGID, cb) {
    this._registerListenerFromCall('fte', 'symbol', FundingTrade, arguments)
  }

  onFundingTradeUpdate(symbol, cgGID, cb) {
    this._registerListenerFromCall('ftu', 'symbol', FundingTrade, arguments)
  }

  onNotification(type, cgGID, cb) {
    this._registerListenerFromCall('n', 'type', Notification, arguments)
  }
}

module.exports = WSv2
