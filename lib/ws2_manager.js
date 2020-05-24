'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bfx:ws2:manager')
const _isEqual = require('lodash/isEqual')
const _isFinite = require('lodash/isFinite')
const _includes = require('lodash/includes')
const _pick = require('lodash/pick')
const Promise = require('bluebird')
const PromiseThrottle = require('promise-throttle')
const WSv2 = require('./ws2')

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
 *
 * @class
 * @augments EventEmitter
 * @memberof module:bitfinex-api-node
 * @example
 * const rest = new RESTv2()
 * const details = await rest.symbolDetails()
 * const symbols = details.map(d => `t${d.pair.toUpperCase()}`)
 * const timeFrames = ['1m', '5m', '30m', '1h', '6h']
 * const keys = _flatten(symbols.map(s => {
 *   return timeFrames.map(tf => `trade:${tf}:${s}`)
 * }))
 *
 * const m = new Manager()
 *
 * m.on('error', (err) => {
 *   debug('error: %s', err)
 * })
 *
 * m.once('open', () => {
 *   debug('open')
 *
 *   keys.forEach(key => {
 *     m.subscribeCandles(key)
 *     m.onCandle({ key }, (candles) => {
 *       debug('recv %d candles on channel %s', candles.length, key)
 *     })
 *   })
 *
 *   symbols.forEach(symbol => {
 *     m.subscribeTrades(symbol)
 *     m.onTrades({ symbol }, (trades) => {
 *       debug('recv %d trades on channel %s', trades.length, symbol)
 *     })
 *   })
 *
 *   symbols.forEach(symbol => {
 *     m.subscribeTicker(symbol)
 *     m.onTicker({ symbol }, (ticker) => {
 *       debug('recv ticker on channel %s: %j', symbol, ticker)
 *     })
 *   })
 *
 *   symbols.forEach(symbol => {
 *     m.subscribeOrderBook(symbol)
 *     m.onOrderBook({ symbol }, (update) => {
 *       debug('recv book update on channel %s: %j', symbol, update)
 *     })
 *   })
 *
 *   setInterval(() => {
 *     debug('num keys: %d', keys.length)
 *     debug('num sockets: %d', m.getNumSockets())
 *     debug('socket info: %j', m.getSocketInfo())
 *   }, 5000)
 * })
 *
 * m.openSocket()
 */
class WS2Manager extends EventEmitter {
  /**
   * @param {module:bitfinex-api-node.WSv2~Configuration} socketArgs - passed
   *   to {@link module:bitfinex-api-node.WSv2|WSv2} constructors
   * @param {object} [authArgs] - cached for all internal socket auth() calls
   * @param {object} [authArgs.calc] - default 0
   * @param {object} [authArgs.dms] - default 0
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
   * Update authentication arguments on all sockets
   *
   * @param {object} args - arguments
   * @param {object} [args.calc] - calc value
   * @param {object} [args.dms] - active 4
   */
  setAuthArgs (args = {}) {
    this._authArgs = {
      ...this._authArgs,
      ...args
    }

    this._sockets.forEach(socket => socket.ws.updateAuthArgs(this._authArgs))
  }

  /**
   * Retrieve internal authentication arguments
   *
   * @returns {object} args
   */
  getAuthArgs () {
    return this._authArgs
  }

  /**
   * Reconnects all open sockets
   *
   * @returns {Promise} p
   */
  async reconnect () {
    return Promise.all(this._sockets.map(socket => socket.ws.reconnect()))
  }

  /**
   * Closes all open sockets
   *
   * @returns {Promise} p
   */
  async close () {
    return Promise.all(this._sockets.map(socket => socket.ws.close()))
  }

  /**
   * @param {module:bitfinex-api-node.WS2Manager~SocketState} s - socket state
   * @returns {number} count - # of subscribed/pending data channels
   */
  static getDataChannelCount (s) {
    let count = s.ws.getDataChannelCount()

    count += s.pendingSubscriptions.length
    count -= s.pendingUnsubscriptions.length

    return count
  }

  /**
   * @returns {number} n
   */
  getNumSockets () {
    return this._sockets.length
  }

  /**
   * @param {number} i - index into pool
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} state
   */
  getSocket (i) {
    return this._sockets[i]
  }

  /**
   * Returns an object which can be logged to inspect the socket pool
   *
   * @returns {object[]} socketInfo
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
   * @param {object} args - arguments
   * @param {object} args.apiKey - saved if not already provided
   * @param {object} args.apiSecret - saved if not already provided
   * @param {object} [args.calc] - default 0
   * @param {object} [args.dms] - dead man switch, active 4
   */
  auth ({ apiKey, apiSecret, calc, dms } = {}) {
    if (this._socketArgs.apiKey || this._socketArgs.apiSecret) {
      debug('error: auth credentials already provided! refusing auth')
      return
    }

    this._socketArgs.apiKey = apiKey
    this._socketArgs.apiSecret = apiSecret

    if (_isFinite(calc)) this._authArgs.calc = calc
    if (_isFinite(dms)) this._authArgs.dms = dms

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
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} state
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
          return debug('socket authenticated')
        }).catch((err) => {
          debug('error authenticating socket: %s', err.message)
        })
      })
    }

    ws.open().then(() => {
      return debug('socket connection opened')
    }).catch((err) => {
      debug('error opening socket: %s', err.stack)
    })

    this._sockets.push(wsState)
    return wsState
  }

  /**
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} state
   */
  getAuthenticatedSocket () {
    return this._sockets.find(s => s.ws.isAuthenticated())
  }

  /**
   * Returns the first socket that has less active/pending channels than the
   * DATA_CHANNEL_LIMIT
   *
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} state - undefined if none found
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
   * @param {object} filter - i.e. { symbol: 'tBTCUSD', prec: 'R0' }
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} wsState -
   *   undefined if not found
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
   * @param {number} chanId - channel ID
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} wsState -
   *   undefined if not found
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
   * @param {string} channel - channel type
   * @param {string} identifier - unique channel identifier
   * @returns {module:bitfinex-api-node.WS2Manager~SocketState} wsState -
   *   undefined if not found
   */
  getSocketWithSubRef (channel, identifier) {
    return this._sockets.find(s => s.ws.hasSubscriptionRef(channel, identifier))
  }

  /**
   * Calls the provided cb with all internal socket instances
   *
   * @param {Function} cb - callback
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
   * @param {object} filter - i.e. { symbol: 'tBTCUSD', prec: 'R0' }
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

  /**
   * @param {string} channel - channel type
   * @param {string} identifier - unique channel identifier
   */
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
   * @param {number} chanId - channel ID
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
   * @param {string} symbol - symbol for ticker
   */
  subscribeTicker (symbol) {
    this.subscribe('ticker', symbol, { symbol })
  }

  /**
   * @param {string} symbol - symbol for trades
   */
  subscribeTrades (symbol) {
    this.subscribe('trades', symbol, { symbol })
  }

  /**
   * @param {string} symbol - symbol for order book
   * @param {string} [prec] - precision, i.e. 'R0', default 'P0'
   * @param {string} [len] - length, default '25'
   * @param {string} [freq] - default 'F0'
   */
  subscribeOrderBook (symbol, prec = 'P0', len = '25', freq = 'F0') {
    const filter = {}

    if (symbol) filter.symbol = symbol
    if (prec) filter.prec = prec
    if (len) filter.len = len
    if (freq) filter.freq = freq

    this.subscribe('book', symbol, filter)
  }

  /**
   * @param {string} key - candle channel key
   */
  subscribeCandles (key) {
    this.subscribe('candles', key, { key })
  }

  /**
   * @param {object} opts - options
   * @param {string} opts.key - candle set key, i.e. trade:30m:tBTCUSD
   * @param {string} [opts.cbGID] - callback group id
   * @param {Function} cb - callback
   * @throws an error if no data socket is available
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
   * @param {object} opts - options
   * @param {string} opts.symbol - order book symbol
   * @param {string} [opts.prec] - precision, i.e. 'R0', default 'P0'
   * @param {string} [opts.len] - length, default '25'
   * @param {string} [opts.freq] - default 'F0'
   * @param {string} [opts.cbGID] - callback group id
   * @param {Function} cb - callback
   * @throws an error if no data socket is available
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
   * @param {object} opts - options
   * @param {string} [opts.symbol] - symbol for trades
   * @param {string} [opts.cbGID] - callback group id
   * @param {Function} cb - callback
   * @throws an error if no data socket is available
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
   * @param {object} opts - options
   * @param {string} [opts.symbol] - symbol for ticker
   * @param {string} [opts.cbGID] - callback group id
   * @param {Function} cb - callback
   * @throws an error if no data socket is available
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
