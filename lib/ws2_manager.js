'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws2_manager')
const _isEqual = require('lodash/isEqual')
const _includes = require('lodash/includes')
const _pick = require('lodash/pick')
const WSv2 = require('./transports/ws2')

const DATA_CHANNEL_LIMIT = 50

// Auto-authenticates if apikey/secret are provided
module.exports = class WS2Manager extends EventEmitter {
  /**
   * @param {Object} socketArgs - passed to WSv2 constructors
   * @param {Object} authArgs - cached for all internal socket auth() calls
   * @param {Object} authArgs.calc - default 0
   * @param {Object} authArgs.dms - default 0
   */
  constructor (socketArgs, authArgs = { calc: 0, dms: 0 }) {
    super()

    this._socketArgs = socketArgs || {}
    this._authArgs = authArgs
    this._sockets = []
  }

  static getDataChannelCount (s) {
    let count = s.ws.getDataChannelCount()

    count += s.pendingSubscriptions.length
    count -= s.pendingUnsubscriptions.length

    return count
  }

  getNumSockets () {
    return this._sockets.length
  }

  getSocket (i) {
    return this._sockets[i]
  }

  getSocketInfo () {
    return this._sockets.map(s => ({
      nChannels: WS2Manager.getDataChannelCount(s)
    }))
  }

  auth ({ apiKey, apiSecret, calc = 0, dms = 0 }) {
    if (this._socketArgs.apiKey || this._socketArgs.apiSecret) {
      debug('error: auth credentials already provided! refusing auth')
      return
    }

    this._socketArgs.apiKey = apiKey
    this._socketArgs.apiSecret = apiSecret
    this._authArgs = { calc, dms }

    this._sockets.forEach(s => {
      if (!s.ws.isAuthenticated()) {
        s.ws.setAuthCredentials(apiKey, apiSecret)
        s.ws.auth({ calc, dms })
      }
    })
  }

  openSocket () {
    const { apiKey, apiSecret } = this._socketArgs
    const { calc, dms } = this._authArgs
    const ws = new WSv2(this._socketArgs)
    const wsState = {
      pendingSubscriptions: [],
      pendingUnsubscriptions: [],
      ws
    }

    ws.once('open', () => debug('socket connection opened'))
    ws.on('open', () => this.emit('open', ws))
    ws.on('message', (msg = {}) => this.emit('message', msg, ws))
    ws.on('error', (error) => this.emit('error', error, ws))
    ws.on('auth', () => this.emit('auth', ws))
    ws.on('close', () => this.emit('close', ws))
    ws.on('subscribed', (msg = {}) => {
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
      this.emit('subscribed', msg)
    })

    ws.on('unsubscribed', (msg = {}) => {
      const { chanId } = msg
      const i = wsState.pendingUnsubscriptions.find(cid => (
        cid === chanId
      ))

      if (i === -1) {
        debug('error removing pending unsub: %j', msg)
        return
      }

      wsState.pendingUnsubscriptions.splice(i, 1)
      this.emit('unsubscribed', msg)
    })

    if (apiKey && apiSecret) { // auto-auth
      ws.once('open', () => {
        debug('authenticating socket...')

        ws.auth(calc, dms)
        ws.once('auth', () => debug('socket authenticated'))
      })
    }

    ws.open()
    this._sockets.push(wsState)
    return wsState
  }

  getFreeDataSocket () {
    return this._sockets.find(s => (
      WS2Manager.getDataChannelCount(s) < DATA_CHANNEL_LIMIT
    ))
  }

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

  // NOTE: Cannot filter against pending subscriptions, due to unknown chanId
  getSocketWithChannel (chanId) {
    return this._sockets.find(s => {
      return (
        s.ws.hasChannel(chanId) &&
        !_includes(s.pendingUnsubscriptions, chanId)
      )
    })
  }

  subscribe (type, ident, filter) {
    let s = this.getFreeDataSocket()
    const doSub = () => {
      s.ws.managedSubscribe(type, ident, filter)
    }

    if (!s) {
      s = this.openSocket()
    }

    if (!s.ws.isOpen()) {
      s.ws.once('open', doSub)
    } else {
      doSub()
    }

    s.pendingSubscriptions.push([type, filter])
  }

  unsubscribe (chanId) {
    const s = this.getSocketWithChannel(chanId)

    if (!s) {
      debug('cannot unsub from unknown channel: %d', chanId)
      return
    }

    s.ws.unsubscribe(chanId)
    s.pendingUnsubscriptions.push(chanId)
  }

  subscribeTicker (symbol) {
    return this.subscribe('ticker', symbol, { symbol })
  }

  subscribeTrades (symbol) {
    return this.subscribe('trades', symbol, { symbol })
  }

  subscribeOrderBook (symbol, prec = 'P0', len = '25') {
    const filter = {}

    if (symbol) filter.symbol = symbol
    if (prec) filter.prec = prec
    if (len) filter.len = len

    return this.subscribe('book', symbol, filter)
  }

  subscribeCandles (key) {
    return this.subscribe('candles', key, { key })
  }

  onCandle ({ key, cbGID }, cb) {
    const s = this.getSocketWithDataChannel('candles', { key })
    s.ws.onCandle({ key, cbGID }, cb)
  }

  onOrderBook ({ symbol, prec = 'P0', len = '25', cbGID }, cb) {
    const filter = {}

    if (symbol) filter.symbol = symbol
    if (prec) filter.prec = prec
    if (len) filter.len = len

    const s = this.getSocketWithDataChannel('book', filter)
    s.ws.onOrderBook({ cbGID, ...filter }, cb)
  }

  onTrades ({ symbol, cbGID }, cb) {
    const s = this.getSocketWithDataChannel('trades', { symbol })
    s.ws.onTrades({ symbol, cbGID }, cb)
  }

  onTicker ({ symbol = '', cbGID } = {}, cb) {
    const s = this.getSocketWithDataChannel('ticker', { symbol })
    s.ws.onTicker({ symbol, cbGID }, cb)
  }
}
