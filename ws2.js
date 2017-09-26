'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws')
const crypto = require('crypto')
const WebSocket = require('ws')
const { isSnapshot } = require('./lib/helper.js')

function passThrough (d) { return d }
/**
 * Handles communitaction with Bitfinex WebSocket API.
 * @param {string} APIKey
 * @param {string} APISecret
 * @param {object} Options
 * @event
 * @class
 */
class BitfinexWS2 extends EventEmitter {
  constructor (apiKey, apiSecret, opts = {}) {
    super()
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.websocketURI = opts.websocketURI || 'wss://api.bitfinex.com/ws/2'
    this.transformer = opts.transformer || passThrough
  }

  open () {
    this.ws = new WebSocket(this.websocketURI)
    this.ws.on('message', this.onMessage.bind(this))
    this.ws.on('open', this.onOpen.bind(this))
    this.ws.on('error', this.onError.bind(this))
    this.ws.on('close', this.onClose.bind(this))
  }

  onMessage (msg, flags) {
    try {
      msg = JSON.parse(msg)
    } catch (e) {
      console.error('[bfx ws2 error] received invalid json')
      console.error('[bfx ws2 error]', msg)
      console.trace()
      return
    }

    debug('Received message: %j', msg)
    debug('Emited message event')
    this.emit('message', msg, flags)
    if (!Array.isArray(msg) && msg.event) {
      if (msg.event === 'subscribed') {
        debug('Subscription report received')
          // Inform the user the new event name that will be triggered
        const data = {
          channel: msg.channel,
          chanId: msg.chanId,
          symbol: msg.symbol,
          key: msg.key
        }

        // https://github.com/bitfinexcom/bitfinex-api-node/issues/37
        if (msg.prec) {
          data.prec = msg.prec
        }

          // Save to event map
        this.channelMap[msg.chanId] = data
        debug('Emitting \'subscribed\' %j', data)
          /**
           * @event BitfinexWS#subscribed
           * @type {object}
           * @property {string} channel - Channel type
           * @property {string} symbol - Symbol of the asset in question (either a trading pair or a funding currency)
           * @property {number} chanId - Channel ID sended by Bitfinex
           */
        this.emit('subscribed', data)
      } else if (msg.event === 'auth' && msg.status !== 'OK') {
        this.emit('error', msg)
        debug('Emitting \'error\' %j', msg)
      } else if (msg.event === 'auth') {
        this.channelMap[msg.chanId] = {
          channel: 'auth'
        }
        debug('Emitting \'%s\' %j', msg.event, msg)
          /**
           * @event BitfinexWS#auth
           */
        this.emit(msg.event, msg)
      } else {
        debug('Emitting \'%s\' %j', msg.event, msg)
        this.emit(msg.event, msg)
      }
    } else {
      this.handleChannel(msg)
    }
  }

  handleChannel (msg) {
    debug('Received data from a channel')
    // First element of Array is the channelId, the rest is the info.
    const channelId = msg.shift() // Pop the first element
    const event = this.channelMap[channelId]

    if (!event) return

    debug('Message in \'%s\' channel', event.channel)
    if (event.channel === 'book') {
      this._processBookEvent(msg, event)
    } else if (event.channel === 'trades') {
      this._processTradeEvent(msg, event)
    } else if (event.channel === 'ticker') {
      this._processTickerEvent(msg, event)
    } else if (event.channel === 'auth') {
      this._processUserEvent(msg)
    } else if (event.channel === 'candles') {
      this._processCandleEvent(msg, event)
    } else {
      debug('Message in unknown channel')
    }
  }

  _processUserEvent (msg) {
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in user channel')
      return
    }

    let event = msg[0]
    const data = msg[1]
    if (event === 'n') { // Notification
      event = data[1]
      this.emit(event, data)
      debug('Emitting \'%s\', %j', event, data)
    } else if (data.length) { // Update
      debug('Emitting \'%s\', %j', event, data)
      this.emit(event, data)
    }
  }

  _processCandleEvent (msg, event) {
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s ticker channel', event.key)
      return
    }

    msg = msg[0]

    const res = this.transformer(msg, 'candles', event.key)
    debug('Emitting candles, %s, %j', event.key, res)
    this.emit('candles', event.key, res)
  }

  _processTickerEvent (msg, event) {
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s ticker channel', event.symbol)
      return
    }

    msg = msg[0]

    const res = this.transformer(msg, 'ticker', event.symbol)
    debug('Emitting ticker, %s, %j', event.symbol, res)
    this.emit('ticker', event.symbol, res)
  }

  _processBookEvent (msg, event) {
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s book channel', event.symbol)
      return
    }

    msg = msg[0]

    const type = event.prec === 'R0' ? 'orderbookRaw' : 'orderbook'
    const res = this.transformer(msg, type, event.symbol)
    debug('Emitting orderbook, %s, %j', event.symbol, res)
    this.emit('orderbook', event.symbol, res)
  }

  _processTradeEvent (msg, event) {
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s trade channel', event.symbol)
      return
    }

    if (isSnapshot(msg)) {
      msg = msg[0]
    }

    const res = this.transformer(msg, 'trades', event.symbol)
    debug('Emitting trade, %s, %j', event.symbol, res)
    this.emit('trade', event.symbol, res)
  }

  close () {
    this.ws.close()
  }

  onOpen () {
    this.channelMap = {} // Map channels IDs to events
    debug('Connection opening, emitting open')
    this.emit('open')
  }

  onError (error) {
    this.emit('error', error)
  }

  onClose () {
    this.emit('close')
  }

  send (msg) {
    debug('Sending %j', msg)
    this.ws.send(JSON.stringify(msg))
  }

  subscribeCandles (symbol = 'tBTCUSD', frame = '1m') {
    this.send({
      event: 'subscribe',
      channel: 'candles',
      key: `trade:${frame}:${symbol}`
    })
  }

  subscribeOrderBook (symbol = 'tBTCUSD', precision = 'P0', length = '25') {
    this.send({
      event: 'subscribe',
      channel: 'book',
      symbol,
      len: length,
      prec: precision
    })
  }

  subscribeTrades (symbol = 'BTCUSD') {
    this.send({
      event: 'subscribe',
      channel: 'trades',
      symbol
    })
  }

  subscribeTicker (symbol = 'tBTCUSD') {
    this.send({
      event: 'subscribe',
      channel: 'ticker',
      symbol
    })
  }

  unsubscribe (chanId) {
    this.send({
      event: 'unsubscribe',
      chanId
    })
  }

  submitOrder (order) {
    this.send(order)
  }

  cancelOrder (orderId) {
    this.send([0, 'oc', null, {
      id: orderId
    }])
  }

  config (flags) {
    this.send({
      flags,
      'event': 'conf'
    })
  }

  auth (calc = 0) {
    const authNonce = (new Date()).getTime() * 1000
    const payload = 'AUTH' + authNonce + authNonce
    const signature = crypto.createHmac('sha384', this.apiSecret).update(payload).digest('hex')
    this.send({
      event: 'auth',
      apiKey: this.apiKey,
      authSig: signature,
      authPayload: payload,
      authNonce: +authNonce + 1,
      calc
    })
  }
}

module.exports = BitfinexWS2
