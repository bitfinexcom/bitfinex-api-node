'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws')
const WebSocket = require('ws')
const Promise = require('bluebird')
const CbQ = require('cbq')
const _Throttle = require('lodash.throttle')
const { genAuthSig, nonce } = require('../util')

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
  TradeTick,
  Wallet,
  OrderBook,
  Candle,
  Tick
} = require('../models')

const WS_URL = 'wss://api.bitfinex.com/ws/2'
const MAX_CALC_OPS = 8
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
   * @param {string} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.url - ws connection url
   * @param {number} opts.orderOpBufferDelay - multi-order op batching timeout
   * @param {boolean} opts.transform - if true, packets are converted to models
   * @param {Object} opts.agent - optional node agent for ws connection (proxy)
   * @param {boolean} opts.manageOrderBooks - enable local OB persistence
   * @param {boolean} opts.manageCandles - enable local candle persistence
   * @param {boolean} opts.seqAudit - enable sequence numbers & verification
   * @param {boolean} opts.autoReconnect - if true, we will reconnect on close
   * @param {number} opts.reconnectDelay - optional, defaults to 1000 (ms)
   * @param {number} opts.packetWDDelay - watch-dog forced reconnection delay
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
    this._seqAudit = opts.seqAudit === true
    this._autoReconnect = opts.autoReconnect === true
    this._reconnectDelay = opts.reconnectDelay || 1000
    this._manageOrderBooks = opts.manageOrderBooks === true
    this._manageCandles = opts.manageCandles === true
    this._packetWDDelay = opts.packetWDDelay
    this._packetWDTimeout = null
    this._packetWDLastTS = 0
    this._orderBooks = {}
    this._candles = {}

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
     * @private
     */
    this._listeners = {}
    this._infoListeners = {} // { [code]: <listeners> }
    this._subscriptionRefs = {}
    this._channelMap = {}
    this._orderBooks = {}
    this._eventCallbacks = new CbQ()
    this._isAuthenticated = false
    this._wasEverAuthenticated = false // used for auto-auth on reconnect
    this._lastPubSeq = -1
    this._lastAuthSeq = -1
    this._isOpen = false
    this._ws = null
    this._isClosing = false // used to block reconnect on direct close() call
    this._isReconnecting = false

    this._onWSOpen = this._onWSOpen.bind(this)
    this._onWSClose = this._onWSClose.bind(this)
    this._onWSError = this._onWSError.bind(this)
    this._onWSMessage = this._onWSMessage.bind(this)
    this._triggerPacketWD = this._triggerPacketWD.bind(this)
    this._sendCalc = _Throttle(this._sendCalc.bind(this), 1000 / MAX_CALC_OPS)
  }

  /**
   * Opens a connection to the API server. Rejects with an error if a
   * connection is already open. Resolves on success
   *
   * @return {Promise} p
   */
  open () {
    if (this._isOpen || this._ws !== null) {
      return Promise.reject(new Error('already open'))
    }

    this._ws = new WebSocket(this._url, {
      agent: this._agent
    })

    if (this._seqAudit) {
      this._ws.once('open', this.enableSequencing.bind(this))
    }

    this._ws.on('message', this._onWSMessage)
    this._ws.on('open', this._onWSOpen)
    this._ws.on('error', this._onWSError)
    this._ws.on('close', this._onWSClose)

    return new Promise((resolve, reject) => {
      this._ws.once('open', () => resolve())
    })
  }

  /**
   * Closes the active connection. If there is none, rejects with a promise.
   * Resolves on success
   *
   * @param {number} code - passed to ws
   * @param {string} reason - passed to ws
   * @return {Promise}
   */
  close (code, reason) {
    if (!this._isOpen || this._ws === null) {
      return Promise.reject(new Error('not open'))
    }

    this._isClosing = true

    return new Promise((resolve, reject) => {
      this._ws.once('close', () => resolve())
      this._ws.close(code, reason)
    })
  }

  /**
   * Generates & sends an authentication packet to the server; if already
   * authenticated, rejects with an error. Resolves on success
   *
   * @param {number} calc - optional, default is 0
   * @return {Promise} p
   */
  auth (calc = 0) {
    if (this._isAuthenticated) {
      return Promise.reject(new Error('already authenticated'))
    }

    const authNonce = nonce()
    const authPayload = `AUTH${authNonce}${authNonce}`
    const { sig } = genAuthSig(this._apiSecret, authPayload)

    return new Promise((resolve, reject) => {
      this._ws.once('auth', () => resolve())

      this.send({
        event: 'auth',
        apiKey: this._apiKey,
        authSig: sig,
        authPayload,
        authNonce,
        calc
      })
    })
  }

  /**
   * Utility method to close & re-open the ws connection. Re-authenticates if
   * previously authenticated
   *
   * @return {Promise} p - resolves on completion
   */
  reconnect () {
    if (!this._ws) return this.open()

    return new Promise((resolve, reject) => {
      this._ws.once('close', () => {
        this.open()

        if (!this._wasEverAuthenticated) {
          return resolve()
        }

        this._ws.once('open', this.auth.bind(this))
        this._ws.once('auth', () => resolve())
      })

      this.close()
    })
  }

  /**
   * Trigger the packet watch-dog; called when we haven't seen a new WS packet
   * for longer than our WD duration (if provided)
   * @private
   */
  _triggerPacketWD () {
    if (!this._packetWDDelay || !this._isOpen) return

    debug(
      'packet delay watchdog triggered [last packet %dms ago]',
      Date.now() - this._packetWDLastTS
    )

    this._packetWDTimeout = null
    this.reconnect()
  }

  /**
   * Reset the packet watch-dog timeout. Should be called on every new WS packet
   * if the watch-dog is enabled
   * @private
   */
  _resetPacketWD () {
    if (!this._packetWDDelay) return
    if (this._packetWDTimeout !== null) {
      clearTimeout(this._packetWDTimeout)
    }

    if (!this._isOpen) return

    this._packetWDTimeout = setTimeout(
      this._triggerPacketWD,
      this._packetWDDelay
    )
  }

  /**
   * @private
   */
  _onWSOpen () {
    this._isOpen = true
    this._isReconnecting = false
    this._packetWDLastTS = Date.now()
    this.emit('open')

    debug('connection open')
  }

  /**
   * @private
   */
  _onWSClose () {
    this._isOpen = false
    this._isAuthenticated = false
    this._lastAuthSeq = -1
    this._lastPubSeq = -1
    this._ws = null
    this._subscriptionRefs = {}
    this._channelMap = {}
    this.emit('close')

    debug('connection closed')

    if (this._autoReconnect && !this._isClosing) {
      setTimeout(this.reconnect.bind(this), this._reconnectDelay)
    }

    this._isClosing = false
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
    const status = arrN[6]
    const msg = arrN[7]

    if (!arrN[4]) return

    if (arrN[1] === 'on-req') {
      const [,, cid] = arrN[4]
      const k = `order-new-${cid}`

      if (status === 'SUCCESS') {
        return this._eventCallbacks.trigger(k, null, arrN[4])
      }

      this._eventCallbacks.trigger(k, new Error(`${status}: ${msg}`), arrN[4])
    } else if (arrN[1] === 'oc-req') {
      const [id] = arrN[4]
      const k = `order-cancel-${id}`

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
    this._packetWDLastTS = Date.now()
    this._resetPacketWD()

    let msg

    try {
      msg = JSON.parse(msgJSON)
    } catch (e) {
      this.emit('error', `invalid message JSON: ${msgJSON}`)
      return
    }

    const seq = msg[msg.length - 1]

    if (this._seqAudit && seq !== 0 && !isNaN(seq)) {
      if (msg[0] === 0) {
        if (this._lastAuthSeq !== -1 && seq > (this._lastAuthSeq + 1)) {
          this.emit('error', new Error(
            `invalid auth seq #; last ${this._lastAuthSeq}, got ${seq}`
          ))

          this._lastAuthSeq = seq
          return
        }

        this._lastAuthSeq = seq
      } else {
        if (this._lastPubSeq !== -1 && seq > (this._lastPubSeq + 1)) {
          this.emit('error', new Error(
            `invalid seq #; last ${this._lastPubSeq}, got ${seq}`
          ))

          this._lastPubSeq = seq
          return
        }

        this._lastPubSeq = seq
      }
    }

    this.emit('message', msg, flags)

    if (Array.isArray(msg)) {
      this._handleChannelMessage(msg)
    } else if (msg.event) {
      this._handleEventMessage(msg)
    } else {
      debug('recv unidentified message: %j', msg)
    }
  }

  /**
   * @param {array} msg
   * @private
   */
  _handleChannelMessage (msg) {
    const [chanId] = msg
    const channelData = this._channelMap[chanId]

    if (!channelData) {
      debug('recv msg from unknown channel %d: %j', chanId, msg)
      return
    }

    debug('recv msg: %j', msg)

    if (msg.length < 2) return
    if (msg[1] === 'hb') return // TODO: optionally track seq

    if (channelData.channel === 'book') {
      return this._handleOBMessage(msg, channelData)
    } else if (channelData.channel === 'trades') {
      return this._handleTradeMessage(msg, channelData)
    } else if (channelData.channel === 'ticker') {
      return this._handleTickerMessage(msg, channelData)
    } else if (channelData.channel === 'candles') {
      return this._handleCandleMessage(msg, channelData)
    } else if (channelData.channel === 'auth') {
      return this._handleAuthMessage(msg, channelData)
    } else {
      this._propagateMessageToListeners(msg)
      this.emit(channelData.channel, msg)
    }
  }

  /**
   * Called for messages from the 'book' channel. Might be an update or a
   * snapshot
   *
   * @param {Array|Array[]} msg
   * @param {Object} chanData - entry from _channelMap
   * @private
   */
  _handleOBMessage (msg, chanData) {
    const { symbol } = chanData
    let data = msg[1]

    if (this._manageOrderBooks) {
      const err = this._updateManagedOB(symbol, data)

      if (err) {
        this.emit('error', err)
        return
      }

      data = this._orderBooks[symbol]
    } else if (data.length > 0 && !Array.isArray(data[0])) {
      data = [data] // always pass on an array of entries
    }

    if (this._transform) {
      data = new OrderBook(data)
    }

    const internalMessage = [chanData.chanId, 'orderbook', data]
    internalMessage.filterOverride = [
      chanData.symbol,
      chanData.prec,
      chanData.len
    ]

    this._propagateMessageToListeners(internalMessage, false)
    this.emit('orderbook', symbol, data)
  }

  /**
   * @param {string} symbol
   * @param {number[]|number[][]} data
   * @return {Error} err - null on success
   * @private
   */
  _updateManagedOB (symbol, data) {
    if (Array.isArray(data[0])) { // snapshot, new OB
      if (this._orderBooks[symbol]) {
        return new Error(`recv snapshot for known OB: ${symbol}`)
      }

      this._orderBooks[symbol] = data
      return null
    }

    // entry, needs to be applied to OB
    if (!this._orderBooks[symbol]) {
      return new Error(`recv update for unknown OB: ${symbol}`)
    }

    const success = OrderBook.updateArrayOBWith(this._orderBooks[symbol], data)

    if (!success) {
      return new Error(
        `ob update for unknown price level: ${JSON.stringify(data)}`
      )
    }

    return null
  }

  /**
   * Returns an up-to-date copy of the order book for the specified symbol, or
   * null if no OB is managed for that symbol.
   * Set `manageOrderBooks: true` in the constructor to use.
   *
   * @param {string} symbol
   * @return {OrderBook} ob - null if not found
   */
  getOB (symbol) {
    if (!this._orderBooks[symbol]) return null

    return new OrderBook(this._orderBooks[symbol])
  }

  /**
   * @param {Array} msg
   * @param {Object} chanData
   * @private
   */
  _handleTradeMessage (msg, chanData) {
    const eventName = msg.length === 3 ? msg[1] : 'trades'
    let payload = msg[msg.length - 1]

    if (!Array.isArray(payload[0])) {
      payload = [payload]
    }

    const model = msg[0] === 0 ? Trade : TradeTick // auth trades have more data
    const data = this._transform ? model.unserialize(payload) : payload
    const internalMessage = [chanData.chanId, eventName, data]
    internalMessage.filterOverride = [chanData.pair]

    this._propagateMessageToListeners(internalMessage, false)
    this.emit('trades', chanData.pair, data)
  }

  /**
   * @param {Array} msg
   * @param {Object} chanData
   * @private
   */
  _handleTickerMessage (msg, chanData) {
    const data = this._transform ? Tick.unserialize(msg[2]) : msg[2]
    const internalMessage = [chanData.chanId, 'ticker', data]
    internalMessage.filterOverride = [chanData.symbol]

    this._propagateMessageToListeners(internalMessage, false)
    this.emit('ticker', chanData.symbol, data)
  }

  /**
   * Called for messages from a 'candles' channel. Might be an update or
   * snapshot.
   *
   * @param {Array|Array[]} msg
   * @param {Object} chanData - entry from _channelMap
   * @private
   */
  _handleCandleMessage (msg, chanData) {
    const { key } = chanData
    let data = msg[1]

    if (this._manageCandles) {
      const err = this._updateManagedCandles(key, data)

      if (err) {
        this.emit('error', err)
        return
      }

      data = this._candles[key]
    } else if (data.length > 0 && !Array.isArray(data[0])) {
      data = [data] // always pass on an array of candles
    }

    if (this._transform) {
      data = Candle.unserialize(data)
    }

    const internalMessage = [chanData.chanId, 'candle', data]
    internalMessage.filterOverride = [chanData.key]

    this._propagateMessageToListeners(internalMessage, false)
    this.emit('candle', data, key)
  }

  /**
   * @param {string} symbol
   * @param {number[]|number[][]} data
   * @return {Error} err - null on success
   * @private
   */
  _updateManagedCandles (key, data) {
    if (Array.isArray(data[0])) { // snapshot, new candles
      if (this._candles[key]) {
        return new Error(`recv snapshot for known candles: ${key}`)
      }

      data.sort((a, b) => b[0] - a[0])

      this._candles[key] = data
      return null
    }

    // entry, needs to be applied to candle set
    if (!this._candles[key]) {
      return new Error(`recv update for unknown candles: ${key}`)
    }

    const candles = this._candles[key]
    let updated = false

    for (let i = 0; i < candles.length; i++) {
      if (data[0] === candles[i][0]) {
        candles[i] = data
        updated = true
        break
      }
    }

    if (!updated) {
      candles.unshift(data)
    }

    return null
  }

  /**
   * Fetch a reference to the full set of synced candles for the specified key.
   * Set `manageCandles: true` in the constructor to use.
   *
   * @param {string} key
   * @return {Array} candles - empty array if none exist
   */
  getCandles (key) {
    return this._candles[key] || []
  }

  /**
   * @param {Array} msg
   * @param {Object} chanData
   * @private
   */
  _handleAuthMessage (msg, chanData) {
    if (msg[1] === 'n') {
      this._onWSNotification(msg[2])
    }

    this._propagateMessageToListeners(msg)
  }

  /**
   * @param {Array} msg
   * @param {boolean} transform - defaults to internal flag
   * @private
   */
  _propagateMessageToListeners (msg, transform = this._transform) {
    const listenerGroups = Object.values(this._listeners)

    for (let i = 0; i < listenerGroups.length; i++) {
      WSv2._notifyListenerGroup(listenerGroups[i], msg, transform, this)
    }
  }

  /**
   * Applies filtering & transform to a packet before sending it out to matching
   * listeners in the group.
   *
   * @param {Object} lGroup - listener group to parse & notify
   * @param {Object} msg - passed to each matched listener
   * @param {boolean} transform - whether or not to instantiate a model
   * @param {WSv2} ws - instance to pass to models if transforming
   * @private
   */
  static _notifyListenerGroup (lGroup, msg, transform, ws) {
    const [, eventName, data] = msg
    let filterByData

    // Catch-all can't filter/transform
    WSv2._notifyCatchAllListeners(lGroup, msg)

    if (!lGroup[eventName] || lGroup[eventName].length === 0) return

    const listeners = lGroup[eventName].filter((listener) => {
      const { filter } = listener

      if (!filter) return true

      // inspect snapshots for matching packets
      if (Array.isArray(data[0])) {
        const matchingData = data.filter((item) => {
          filterByData = msg.filterOverride ? msg.filterOverride : item

          return WSv2._payloadPassesFilter(filterByData, filter)
        })

        return matchingData.length !== 0
      }

      // inspect single packet
      filterByData = msg.filterOverride ? msg.filterOverride : data

      return WSv2._payloadPassesFilter(filterByData, filter)
    })

    if (listeners.length === 0) return

    listeners.forEach(({ cb, modelClass }) => {
      const ModelClass = modelClass

      if (!transform || data.length === 0) {
        cb(data)
      } else if (Array.isArray(data[0])) {
        cb(data.map((entry) => {
          return new ModelClass(entry, ws)
        }))
      } else {
        cb(new ModelClass(data, ws))
      }
    })
  }

  /**
   * @param {Array} payload
   * @param {Object} filter
   * @return {boolean} pass
   * @private
   */
  static _payloadPassesFilter (payload, filter) {
    const filterIndices = Object.keys(filter)

    for (let k = 0; k < filterIndices.length; k++) {
      if (!filter[filterIndices[k]]) continue // no value provided

      if (payload[+filterIndices[k]] !== filter[filterIndices[k]]) {
        return false
      }
    }

    return true
  }

  /**
   * @param {Object} lGroup - listener group keyed by event ('' in this case)
   * @param {*} data - packet to pass to listeners
   * @private
   */
  static _notifyCatchAllListeners (lGroup, data) {
    if (!lGroup['']) return

    for (let j = 0; j < lGroup[''].length; j++) {
      lGroup[''][j].cb(data)
    }
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleEventMessage (msg) {
    if (msg.event === 'auth') {
      return this._handleAuthEvent(msg)
    } else if (msg.event === 'subscribed') {
      return this._handleSubscribedEvent(msg)
    } else if (msg.event === 'unsubscribed') {
      return this._handleUnsubscribedEvent(msg)
    } else if (msg.event === 'info') {
      return this._handleInfoEvent(msg)
    } else if (msg.event === 'conf') {
      return this._handleConfigEvent(msg)
    } else if (msg.event === 'error') {
      return this._handleErrorEvent(msg)
    }

    debug('recv unknown event message: %j', msg)
    return null
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleConfigEvent (msg) {
    if (msg.status !== 'OK') {
      debug('config failed: %j', msg)
      return this.emit('error', msg)
    }
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleErrorEvent (msg) {
    this.emit('error', msg)
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleAuthEvent (msg) {
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
  _handleSubscribedEvent (msg) {
    this._channelMap[msg.chanId] = msg

    debug('subscribed to %s [%d]', msg.channel, msg.chanId)
    this.emit('subscribed', msg)
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleUnsubscribedEvent (msg) {
    delete this._channelMap[msg.chanId]

    debug('unsubscribed from %s [%d]', msg.channel, msg.chanId)
    this.emit('unsubscribed', msg)
  }

  /**
   * @param {Object} msg
   * @private
   */
  _handleInfoEvent (msg) {
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
   * already subscribed to the specified pair, nothing happens.
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
   * @param {Object} opts
   * @param {number} opts.chanId
   * @param {string} opts.channel - optional
   * @param {string} opts.symbol - optional
   * @param {string} opts.key - optional
   * @return {Object} chanData - null if not found
   */
  getChannelData ({ chanId, channel, symbol, key }) {
    const id = chanId || this._chanIdByIdentifier(channel, symbol || key)

    return this._channelMap[id] || null
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
   *
   * @param {Object} args
   * @param {boolean} args.audit - if true, an error is emitted on invalid seq
   */
  enableSequencing (args = { audit: true }) {
    this._seqAudit = args.audit === true

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
   * @param {Object} payload - optional extra packet data
   */
  subscribe (channel, payload) {
    this.send(Object.assign({
      event: 'subscribe',
      channel
    }, payload))
  }

  /**
   * @param {string} symbol
   * @return {boolean} subscribed
   */
  subscribeTicker (symbol) {
    return this.managedSubscribe('ticker', symbol, { symbol })
  }

  /**
   * @param {string} symbol
   * @return {boolean} subscribed
   */
  subscribeTrades (symbol) {
    return this.managedSubscribe('trades', symbol, { symbol })
  }

  /**
   * @param {string} symbol
   * @param {string} prec - P0, P1, P2, or P3 (default P0)
   * @param {string} len - 25 or 100 (default 25)
   * @return {boolean} subscribed
   */
  subscribeOrderBook (symbol, prec = 'P0', len = '25') {
    return this.managedSubscribe('book', symbol, { symbol, len, prec })
  }

  /**
   * @param {string} key
   * @return {boolean} subscribed
   */
  subscribeCandles (key) {
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
   * @return {boolean} unsubscribed
   */
  unsubscribeTicker (symbol) {
    return this.managedUnsubscribe('ticker', symbol)
  }

  /**
   * @param {string} symbol
   * @return {boolean} unsubscribed
   */
  unsubscribeTrades (symbol) {
    return this.managedUnsubscribe('trades', symbol)
  }

  /**
   * @param {string} symbol
   * @param {string} prec - P0, P1, P2, or P3 (default P0)
   * @param {string} len - 25 or 100 (default 25)
   * @return {boolean} unsubscribed
   */
  unsubscribeOrderBook (symbol, prec = 'P0', len = '25') {
    return this.managedUnsubscribe('book', symbol)
  }

  /**
   * @param {string} symbol
   * @param {string} frame - time frame
   * @return {boolean} unsubscribed
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

  /**
   * @param {string[]} prefixes
   */
  requestCalc (prefixes) {
    this._sendCalc([0, 'calc', null, prefixes.map(p => [p])])
  }

  /**
   * Throttled call to ws.send, max 8 op/s
   *
   * @param {Array} msg
   * @private
   */
  _sendCalc (msg) {
    debug('req calc: %j', msg)

    this._ws.send(msg)
  }

  /**
   * Sends a new order to the server and resolves the returned promise once the
   * order submit is confirmed. Emits an error if not authenticated. The order
   * can be either an array, key/value map, or Order object instance.
   *
   * @param {Object|Array} order
   * @return {Promise} p - resolves on submit notification
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

    return this._getEventPromise(`order-new-${packet.cid}`)
  }

  /**
   * Cancels an order by ID and resolves the returned promise once the cancel is
   * confirmed. Emits an error if not authenticated. The ID can be passed as a
   * number, or taken from an order array/object.
   *
   * @param {Object|Array|number} order
   * @return {Promise} p
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
   * Cancels multiple orders, returns a promise that resolves once all
   * operations are confirmed.
   *
   * @see cancelOrder
   *
   * @param {Object[]|Array[]|number[]} orders
   * @return {Promise} p
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
   * Sends the op payloads to the server as an 'ox_multi' command. A promise is
   * returned and resolves immediately if authenticated, as no confirmation is
   * available for this message type.
   *
   * @param {Object[]} opPayloads
   * @return {Promise} p - rejects if not authenticated
   */
  submitOrderMultiOp (opPayloads) {
    if (!this._isAuthenticated) {
      return Promise.reject(new Error('not authenticated'))
    }

    this.send([0, 'ox_multi', null, opPayloads])

    return Promise.resolve() // TODO: multi-op tracking
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
   * Splits the op buffer into packets of max 15 ops each, and sends them down
   * the wire.
   *
   * @return {Promise} p - resolves after send
   * @private
   */
  _flushOrderOps () {
    this._orderOpTimeout = null

    const packets = this._orderOpBuffer.map(p => [p[1], p[3]])
    this._orderOpBuffer = []

    if (packets.length <= 15) {
      return this.submitOrderMultiOp(packets)
    }

    const promises = []

    while (packets.length > 0) {
      const opPackets = packets.splice(0, Math.min(packets.length, 15))
      promises.push(this.submitOrderMultiOp(opPackets))
    }

    return Promise.all(promises)
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
   * @param {Object} filter - map of index & value in ws packet
   * @param {object} modelClass - model to use for serialization
   * @param {string} cbGID - listener group ID for mass removal
   * @param {method} cb - listener
   * @private
   */
  _registerListener (eventName, filter, modelClass, cbGID, cb) {
    if (!cbGID) cbGID = null

    if (!this._listeners[cbGID]) {
      this._listeners[cbGID] = { [eventName]: [] }
    }

    const listeners = this._listeners[cbGID]

    if (!listeners[eventName]) {
      listeners[eventName] = []
    }

    const l = {
      cb,
      modelClass,
      filter
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

  /**
   * @param {Object} opts
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   */
  onMessage ({ cbGID }, cb) {
    this._registerListener('', null, null, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.key - candle set key, i.e. trade:30m:tBTCUSD
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-candle
   */
  onCandle ({ key, cbGID }, cb) {
    this._registerListener('candle', { 0: key }, Candle, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.prec
   * @param {string} opts.len
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-order-books
   */
  onOrderBook ({ symbol, prec, len, cbGID }, cb) {
    this._registerListener('orderbook', {
      0: symbol,
      1: prec,
      2: len
    }, OrderBook, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.pair
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-trades
   */
  onTrades ({ pair, cbGID }, cb) {
    this._registerListener('trades', { 0: pair }, TradeTick, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-ticker
   */
  onTicker ({ symbol, cbGID }, cb) {
    this._registerListener('ticker', { 0: symbol }, Tick, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {number} opts.gid
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-orders
   */
  onOrderSnapshot ({ symbol, gid, cbGID }, cb) {
    this._registerListener('os', { 3: symbol, 1: gid }, Order, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {number} opts.gid
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-orders
   */
  onOrderNew ({ symbol, gid, cbGID }, cb) {
    this._registerListener('on', { 3: symbol, 1: gid }, Order, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {number} opts.gid
   * @param {number} opts.cid
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-orders
   */
  onOrderUpdate ({ symbol, gid, cid, cbGID }, cb) {
    this._registerListener('ou', { 3: symbol, 1: gid, 2: cid }, Order, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {number} opts.gid
   * @param {number} opts.cid
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-orders
   */
  onOrderClose ({ symbol, gid, cid, cbGID }, cb) {
    this._registerListener('oc', { 3: symbol, 1: gid, 2: cid }, Order, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-position
   */
  onPositionSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('ps', { 0: symbol }, Position, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-position
   */
  onPositionNew ({ symbol, cbGID }, cb) {
    this._registerListener('pn', { 0: symbol }, Position, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-position
   */
  onPositionUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('pu', { 0: symbol }, Position, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-position
   */
  onPositionClose ({ symbol, cbGID }, cb) {
    this._registerListener('pc', { 0: symbol }, Position, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.pair
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-trades
   */
  onTradeEntry ({ pair, cbGID }, cb) {
    this._registerListener('te', { 0: pair }, Trade, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.pair
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-trades
   */
  onTradeUpdate ({ pair, cbGID }, cb) {
    this._registerListener('tu', { 0: pair }, Trade, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-offers
   */
  onFundingOfferSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('fos', { 1: symbol }, FundingOffer, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-offers
   */
  onFundingOfferNew ({ symbol, cbGID }, cb) {
    this._registerListener('fon', { 1: symbol }, FundingOffer, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-offers
   */
  onFundingOfferUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('fou', { 1: symbol }, FundingOffer, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-offers
   */
  onFundingOfferClose ({ symbol, cbGID }, cb) {
    this._registerListener('foc', { 1: symbol }, FundingOffer, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-credits
   */
  onFundingCreditSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('fcs', { 1: symbol }, FundingCredit, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-credits
   */
  onFundingCreditNew ({ symbol, cbGID }, cb) {
    this._registerListener('fcn', { 1: symbol }, FundingCredit, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-credits
   */
  onFundingCreditUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('fcu', { 1: symbol }, FundingCredit, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-credits
   */
  onFundingCreditClose ({ symbol, cbGID }, cb) {
    this._registerListener('fcc', { 1: symbol }, FundingCredit, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-loans
   */
  onFundingLoanSnapshot ({ symbol, cbGID }, cb) {
    this._registerListener('fls', { 1: symbol }, FundingLoan, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-loans
   */
  onFundingLoanNew ({ symbol, cbGID }, cb) {
    this._registerListener('fln', { 1: symbol }, FundingLoan, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-loans
   */
  onFundingLoanUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('flu', { 1: symbol }, FundingLoan, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-loans
   */
  onFundingLoanClose ({ symbol, cbGID }, cb) {
    this._registerListener('flc', { 1: symbol }, FundingLoan, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-wallets
   */
  onWalletSnapshot ({ cbGID }, cb) {
    this._registerListener('ws', null, Wallet, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-wallets
   */
  onWalletUpdate ({ cbGID }, cb) {
    this._registerListener('wu', null, Wallet, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-balance
   */
  onBalanceInfoUpdate ({ cbGID }, cb) {
    this._registerListener('bu', null, BalanceInfo, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-margin
   */
  onMarginInfoUpdate ({ cbGID }, cb) {
    this._registerListener('miu', null, MarginInfo, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-funding
   */
  onFundingInfoUpdate ({ cbGID }, cb) {
    this._registerListener('fiu', null, FundingInfo, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades
   */
  onFundingTradeEntry ({ symbol, cbGID }, cb) {
    this._registerListener('fte', { 1: symbol }, FundingTrade, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades
   */
  onFundingTradeUpdate ({ symbol, cbGID }, cb) {
    this._registerListener('ftu', { 1: symbol }, FundingTrade, cbGID, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.type
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-auth-notifications
   */
  onNotification ({ type, cbGID }, cb) {
    this._registerListener('n', { 1: type }, Notification, cbGID, cb)
  }
}

WSv2.info = INFO_CODES

module.exports = WSv2
