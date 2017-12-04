'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws')
const crypto = require('crypto')
const WebSocket = require('ws')
const { isSnapshot } = require('./lib/helper.js')
const { dummyTransform } = require('./lib/transformer.js')

/**
 * Handles communication with Bitfinex WebSocket API.
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
    this.transformer = opts.transformer || dummyTransform
    this.agent = opts.agent
  }

  open () {
    this.ws = new WebSocket(this.websocketURI, { agent: this.agent })

    this.ws.on('message', this.onMessage.bind(this))
    this.ws.on('open', this.onOpen.bind(this))
    this.ws.on('error', this.onError.bind(this))
    this.ws.on('close', this.onClose.bind(this))
  }

  onMessage (msgJSON, flags) {
    let msg

    try {
      msg = JSON.parse(msgJSON)
    } catch (e) {
      console.error('[bfx ws2 error] received invalid json')
      console.error('[bfx ws2 error]', msgJSON)
      console.trace()
      return
    }

    debug('Received message: %j', msg)
    this.emit('message', msg, flags)
    debug('Emited message event')

    // Drop out early if channel data
    if (Array.isArray(msg) || !msg.event) {
      return this.handleChannel(msg)
    }

    if (msg.event === 'subscribed') {
      debug('Subscription report received')
      this.channelMap[msg.chanId] = msg

    // Overwrite as error if auth failed
    } else if (msg.event === 'auth') {
      if (msg.status !== 'OK') {
        debug('Emitting \'error\' %j', msg)
        this.emit('error', msg)
        return
      }

      this.channelMap[msg.chanId] = { channel: 'auth' }
    }

    debug('Emitting \'%s\' %j', msg.event, msg)
    this.emit(msg.event, msg)
  }

  handleChannel (msg) {
    debug('Received data from a channel')

    // First element of Array is the channelId, the rest is the info.
    const channelId = msg.shift() // Pop the first element
    const event = this.channelMap[channelId]

    if (!event) return

    debug('Message in \'%s\' channel', event.channel)

    if (msg[0] === 'hb') {
      debug(`recv hb in ${event.key || event.symbol} ${event.channel} channel`)
      return
    }

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
    if (msg[0] === 'hb') {
      debug('Received heartbeat in user channel')
      return
    }

    let event = msg[0]
    const data = msg[1]

    if (!data.length) return

    if (event === 'n') { // Notification, event is nested
      event = data[1]
    }

    debug('Emitting \'%s\', %j', event, data)
    this.emit(event, data)
  }

  _processCandleEvent (msg, event) {
    const res = this.transformer(msg[0], 'candles', event.key)

    debug('Emitting candles, %s, %j', event.key, res)
    this.emit('candles', event.key, res)
  }

  _processTickerEvent (msg, event) {
    const res = this.transformer(msg[0], 'ticker', event.symbol)

    debug('Emitting ticker, %s, %j', event.symbol, res)
    this.emit('ticker', event.symbol, res)
  }

  _processBookEvent (msg, event) {
    const type = event.prec === 'R0' ? 'orderbookRaw' : 'orderbook'
    const res = this.transformer(msg[0], type, event.symbol)

    debug('Emitting orderbook, %s, %j', event.symbol, res)
    this.emit('orderbook', event.symbol, res)
  }

  _processTradeEvent (msg, event) {
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

  subscribeOrderBook (symbol = 'tBTCUSD', prec = 'P0', len = '25') {
    this.send({
      event: 'subscribe',
      channel: 'book',
      symbol,
      len,
      prec
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
      event: 'conf',
      flags
    })
  }

  auth (calc = 0) {
    const authNonce = Date.now() * 1000
    const payload = `AUTH${authNonce}${authNonce}`

    const signature = crypto
      .createHmac('sha384', this.apiSecret)
      .update(payload)
      .digest('hex')

    this.send({
      event: 'auth',
      apiKey: this.apiKey,
      authSig: signature,
      authPayload: payload,
      authNonce: authNonce + 1,
      calc
    })
  }
}

module.exports = BitfinexWS2
