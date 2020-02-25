'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bfx:ws2:manager')
const _isEqual = require('lodash/isEqual')
const _includes = require('lodash/includes')
const _pick = require('lodash/pick')
const PromiseThrottle = require('promise-throttle')
const WSv2 = require('./transports/ws2')

const DATA_CHANNEL_LIMIT = 30
const reconnectThrottler = new PromiseThrottle({
  requestsPerSecond: 10 / 60.0,
  promiseImplementation: Promise
})

/**
 * Provides a wrapper around the WSv2 class, opening new sockets when a
 * subscription would push a single socket over the data channel limit.
 *
 * For more complex operations, grab a socket reference with getSocket() or
 * getFreeDataSocket(), or create a new WSv2 instance manually
 */
class WS2Manager extends EventEmitter {
  /**
   * @param {Object} socketArgs - passed to WSv2 constructors
   * @param {Object} authArgs - cached for all internal socket auth() calls
   * @param {Object} authArgs.calc - default 0
   * @param {Object} authArgs.dms - default 0
   */
  constructor (socketArgs, authArgs = { calc: 0, dms: 0 }) {
    super()

    this.setMaxListeners(1000)

    this._authArgs = authArgs
    this._sockets = []
    this._socketArgs = {
      ...(socketArgs || {}),
      reconnectThrottler
    }
  }

  /**
   * Update authentication arguments
   *
   * @param {Object} args
   */
  setAuthArgs (args = {}) {
    this._authArgs = {
      ...this._authArgs,
      ...args
    }

    this._sockets.forEach(socket => socket.ws.updateAuthArgs(this._authArgs))
  }

  /**
   * Reconnects all open sockets
   */
  reconnect () {
    this._sockets.forEach(socket => socket.ws.reconnect())
  }

  /**
   * Closes all open sockets
   */
  close () {
    this._sockets.forEach(socket => socket.ws.close())
  }

  /**
   * @param {Object} s - socket state
   * @return {number} count - # of subscribed/pending data channels
   */
  static getDataChannelCount (s) {
    let count = s.ws.getDataChannelCount()

    count += s.pendingSubscriptions.length
    count -= s.pendingUnsubscriptions.length

    return count
  }

  /**
   * @return {number} n
   */
  getNumSockets () {
    return this._sockets.length
  }

  /**
   * @param {number} i
   * @return {Object} state
   */
  getSocket (i) {
    return this._sockets[i]
  }

  /**
   * Returns an object which can be logged to inspect the socket pool
   */
  getSocketInfo () {
    return this._sockets.map(s => ({
      nChannels: WS2Manager.getDataChannelCount(s)
    }))
  }

  /**
   * Authenticates all existing & future sockets with the provided credentials.
   * Does nothing if an apiKey/apiSecret pair are already known.
   *
   * @param {Object} args
   * @param {Object?} args.apiKey - saved if not already provided
   * @param {Object?} args.apiSecret - saved if not already provided
   * @param {Object?} args.calc - default 0
   * @param {Object?} args.dms - dead man switch, active 4
   */
  auth ({ apiKey, apiSecret, calc = 0, dms = 0 } = {}) {
    if (this._socketArgs.apiKey || this._socketArgs.apiSecret) {
      debug('error: auth credentials already provided! refusing auth')
      return
    }

    this._socketArgs.apiKey = apiKey
    this._socketArgs.apiSecret = apiSecret
    this._authArgs = {
      ...this._authArgs,
      calc,
      dms,
    }

    this._sockets.forEach(s => {
      if (!s.ws.isAuthenticated()) {
        s.ws.setAPICredentials(apiKey, apiSecret)
        s.ws.updateAuthArgs(this._authArgs)
        s.ws.auth()
      }
    })
  }

  /**
   * Creates a new socket/state instance and adds it to the internal pool. Binds
   * event listeners to forward via our own event emitter, and to manage pending
   * subs/unsubs.
   *
   * @return {Object} state
   */
  openSocket () {
    const { apiKey, apiSecret } = this._socketArgs
    const ws = new WSv2(this._socketArgs)
    const wsState = {
      pendingSubscriptions: [],
      pendingUnsubscriptions: [],
      ws
    }

    ws.updateAuthArgs(this._authArgs)
    ws.on('open', () => this.emit('open', ws))
    ws.on('message', (msg = {}) => this.emit('message', msg, ws))
    ws.on('error', (error) => this.emit('error', error, ws))
    ws.on('auth', () => this.emit('auth', ws))
    ws.on('close', () => this.emit('close', ws))
    ws.on('subscribed', (msg = {}) => {
      this.emit('subscribed', msg)

      const i = wsState.pendingSubscriptions.find(sub => {
        const fv = _pick(msg, Object.keys(sub[1]))

        return (
          (sub[0] === msg.channel) &&
          _isEqual(fv, sub[1])
        )
      })

      if (i === -1) {
        debug('error removing pending sub: %j', msg)
        return
      }

      wsState.pendingSubscriptions.splice(i, 1)
    })

    ws.on('unsubscribed', (msg = {}) => {
      this.emit('unsubscribed', msg)

      const { chanId } = msg
      const i = wsState.pendingUnsubscriptions.findIndex(cid => (
        cid === `${chanId}`
      ))

      if (i === -1) {
        debug('error removing pending unsub: %j', msg)
        return
      }

      wsState.pendingUnsubscriptions.splice(i, 1)
    })

    if (apiKey && apiSecret) { // auto-auth
      ws.once('open', () => {
        debug('authenticating socket...')

        ws.auth().then(() => {
          debug('socket authenticated')
        }).catch((err) => {
          debug('error authenticating socket: %s', err.message)
        })
      })
    }

    ws.open().then(() => {
      debug('socket connection opened')
    }).catch((err) => {
      debug('error opening socket: %s', err.stack)
    })

    this._sockets.push(wsState)
    return wsState
  }

  getAuthenticatedSocket () {
    return this._sockets.find(s => s.ws.isAuthenticated())
  }

  /**
   * Returns the first socket that has less active/pending channels than the
   * DATA_CHANNEL_LIMIT
   *
   * @return {Object} state - undefined if none found
   */
  getFreeDataSocket () {
    return this._sockets.find(s => (
      WS2Manager.getDataChannelCount(s) < DATA_CHANNEL_LIMIT
    ))
  }

  /**
   * Returns the first socket that is subscribed/pending sub to the specified
   * channel.
   *
   * @param {string} type - i.e. 'book'
   * @param {Object} filter - i.e. { symbol: 'tBTCUSD', prec: 'R0' }
   * @return {Object} wsState - undefined if not found
   */
  getSocketWithDataChannel (type, filter) {
    return this._sockets.find(s => {
      const subI = s.pendingSubscriptions.findIndex(s => (
        s[0] === type && _isEqual(s[1], filter)
      ))

      if (subI !== -1) {
        return true
      }

      // Confirm unsub is not pending
      const cid = s.ws.getDataChannelId(type, filter)

      if (!cid) {
        return false
      }

      return cid && !_includes(s.pendingUnsubscriptions, cid)
    })
  }

  /**
   * NOTE: Cannot filter against pending subscriptions, due to unknown chanId
   *
   * @param {number} chanId
   * @return {Object} wsState - undefined if not found
   */
  getSocketWithChannel (chanId) {
    return this._sockets.find(s => {
      return (
        s.ws.hasChannel(chanId) &&
        !_includes(s.pendingUnsubscriptions, chanId)
      )
    })
  }

  /**
   * @param {string} channel
   * @param {string} identifier
   * @return {Object} wsState - undefined if not found
   */
  getSocketWithSubRef (channel, identifier) {
    return this._sockets.find(s => s.ws.hasSubscriptionRef(channel, identifier))
  }

  /**
   * Calls the provided cb with all internal socket instances
   *
   * @param {Function} cb
   */
  withAllSockets (cb) {
    this._sockets.forEach((ws2) => {
      cb(ws2)
    })
  }

  /**
   * Subscribes a free data socket if available to the specified channel, or
   * opens a new socket & subs if needed.
   *
   * @param {string} type - i.e. 'book'
   * @param {string} ident - i.e. 'tBTCUSD'
   * @param {Object} filter - i.e. { symbol: 'tBTCUSD', prec: 'R0' }
   */
  subscribe (type, ident, filter) {
    let s = this.getFreeDataSocket()
    if (!s) {
      s = this.openSocket()
    }

    const doSub = () => {
      s.ws.managedSubscribe(type, ident, filter)
    }

    if (!s.ws.isOpen()) {
      s.ws.once('open', doSub)
    } else {
      doSub()
    }

    s.pendingSubscriptions.push([type, filter])
  }

  managedUnsubscribe (channel, identifier) {
    const s = this.getSocketWithSubRef(channel, identifier)

    if (!s) {
      debug('cannot unsub from unknown channel %s: %s', channel, identifier)
      return
    }

    const chanId = s.ws._chanIdByIdentifier(channel, identifier)
    s.ws.managedUnsubscribe(channel, identifier)
    s.pendingUnsubscriptions.push(chanId)
  }

  /**
   * Unsubscribes the first socket w/ the specified channel. Does nothing if no
   * such socket is found.
   *
   * @param {number} chanId
   */
  unsubscribe (chanId) {
    const s = this.getSocketWithChannel(chanId)

    if (!s) {
      debug('cannot unsub from unknown channel: %d', chanId)
      return
    }

    s.ws.unsubscribe(chanId)
    s.pendingUnsubscriptions.push(chanId)
  }

  /**
   * @param {string} symbol
   */
  subscribeTicker (symbol) {
    return this.subscribe('ticker', symbol, { symbol })
  }

  /**
   * @param {string} symbol
   */
  subscribeTrades (symbol) {
    return this.subscribe('trades', symbol, { symbol })
  }

  /**
   * @param {string} symbol
   * @param {string} prec
   * @param {string} len
   * @param {string} freq
   */
  subscribeOrderBook (symbol, prec = 'P0', len = '25', freq = 'F0') {
    const filter = {}

    if (symbol) filter.symbol = symbol
    if (prec) filter.prec = prec
    if (len) filter.len = len
    if (freq) filter.freq = freq

    return this.subscribe('book', symbol, filter)
  }

  /**
   * @param {string} key
   */
  subscribeCandles (key) {
    return this.subscribe('candles', key, { key })
  }

  /**
   * @param {Object} opts
   * @param {string} opts.key - candle set key, i.e. trade:30m:tBTCUSD
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-candle
   */
  onCandle ({ key, cbGID }, cb) {
    const s = this.getSocketWithDataChannel('candles', { key })

    if (!s) {
      throw new Error('no data socket available; did you provide a key?')
    }

    s.ws.onCandle({ key, cbGID }, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.prec
   * @param {string} opts.len
   * @param {string} opts.freq
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-order-books
   */
  onOrderBook ({ symbol, prec = 'P0', len = '25', freq = 'F0', cbGID }, cb) {
    const filter = {}

    if (symbol) filter.symbol = symbol
    if (prec) filter.prec = prec
    if (len) filter.len = len
    if (freq) filter.freq = freq

    const s = this.getSocketWithDataChannel('book', filter)

    if (!s) {
      throw new Error('no data socket available; did you provide a symbol?')
    }

    s.ws.onOrderBook({ cbGID, ...filter }, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-trades
   */
  onTrades ({ symbol, cbGID }, cb) {
    const s = this.getSocketWithDataChannel('trades', { symbol })

    if (!s) {
      throw new Error('no data socket available; did you provide a symbol?')
    }

    s.ws.onTrades({ symbol, cbGID }, cb)
  }

  /**
   * @param {Object} opts
   * @param {string} opts.symbol
   * @param {string} opts.cbGID - callback group id
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#ws-public-ticker
   */
  onTicker ({ symbol = '', cbGID } = {}, cb) {
    const s = this.getSocketWithDataChannel('ticker', { symbol })

    if (!s) {
      throw new Error('no data socket available; did you provide a symbol?')
    }

    s.ws.onTicker({ symbol, cbGID }, cb)
  }
}

module.exports = WS2Manager
