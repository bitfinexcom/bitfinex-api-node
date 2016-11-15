'use strict'

const EventEmitter = require('events').EventEmitter
const debug = require('debug')('bitfinex:ws')
const crypto = require('crypto')
const WebSocket = require('ws')
const util = require('util')

/**
 * Handles communitaction with Bitfinex WebSocket API.
 * @param {string} APIKey
 * @param {string} APISecret
 * @event
 * @class
 */
class BitfinexWS2 extends EventEmitter {
  constructor(api_key, api_secret) {
    super()
    // EventEmitter.call(this)
    this.api_key = api_key
    this.api_secret = api_secret
    this.websocketURI = 'wss://api.bitfinex.com/ws/2'
    this.ws = new WebSocket(this.websocketURI)
    this.ws.on('message', this.onMessage.bind(this))
    this.ws.on('open', this.onOpen.bind(this))
    this.ws.on('error', this.onError.bind(this))
    this.ws.on('close', this.onClose.bind(this))
  }

  onMessage(msg, flags) {
    msg = JSON.parse(msg)
    debug('Received message: %j', msg)
    debug('Emmited message event')
    this.emit('message', msg, flags)

    if (!Array.isArray(msg) && msg.event) {
      if (msg.event === 'subscribed') {
        debug('Subscription report received')
          // Inform the user the new event name that will be triggered
        let data = {
            channel: msg.channel,
            chanId: msg.chanId,
            pair: msg.pair
          }
          // Save to event map
        this.channelMap[msg.chanId] = data
        debug('Emitting \'subscribed\' %j', data)
          /**
           * @event BitfinexWS#subscribed
           * @type {object}
           * @property {string} channel - Channel type
           * @property {string} pair - Currency pair.
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
      debug('Received data from a channel')
        // First telement of Array is the channelId, the rest is the info.
      let channelId = msg.shift() // Pop the first element
      let event = this.channelMap[channelId]
      if (event) {
        debug('Message in \'%s\' channel', event.channel)
        if (event.channel === 'book') {
          this._processBookEvent(msg, event)
        } else if (event.channel === 'trades') {
          this._processTradeEvent(msg, event)
        } else if (event.channel === 'ticker') {
          this._processTickerEvent(msg, event)
        } else if (event.channel === 'auth') {
          this._processUserEvent(msg)
        } else {
          debug('Message in unknown channel')
        }
      }
    }
  }

  _processUserEvent(msg) {
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in user channel')
    } else {
      let event = msg[0]
      let data = msg[1]
      if (Array.isArray(data[0])) {
        data[0].forEach(function(ele) {
          debug('Emitting \'%s\' %j', event, ele)
          this.emit(event, ele)
        }.bind(this))
      } else if (data.length) {
        debug('Emitting \'%s\', %j', event, data)
        this.emit(event, data)
      }
    }
  }

  _processTickerEvent(msg, event) {
    debug('Incoming args for ticker event, %j, %j', msg, event)
    if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s ticker channel', event.pair)
    } else {
      debug('Emitting ticker, %s, %j', event.pair, msg)
      this.emit('ticker', event.pair, msg)
    }
  }

  _processBookEvent(msg, event) {
    if (Array.isArray(msg[0])) {
      msg[0].forEach(function(book_level) {
        debug('Emitting orderbook, %s, %j', event.pair, book_level)
        this.emit('orderbook', event.pair, book_level)
      }.bind(this))
    } else if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s book channel', event.pair)
    } else if (msg.length > 2) {
      debug('Emitting orderbook, %s, %j', event.pair, msg)
      this.emit('orderbook', event.pair, msg)
    }
  }

  _processTradeEvent(msg, event) {
    if (Array.isArray(msg[0])) {
      msg[0].forEach(function(trade) {
        debug('Emitting trade, %s, %j', event.pair, trade)
        this.emit('trade', event.pair, trade)
      }.bind(this))
    } else if (msg[0] === 'hb') { // HeatBeart
      debug('Received HeatBeart in %s trade channel', event.pair)
    } else if (msg[0] === 'te') { // Trade executed
      debug('Emitting trade, %s, %j', event.pair, msg)
      this.emit('trade', event.pair, msg)
    } else if (msg[0] === 'tu') { // Trade executed
      debug('Emitting trade, %s, %j', event.pair, msg)
      this.emit('trade', event.pair, msg)
    }
  }

  close() {
    this.ws.close()
  }

  onOpen() {
    this.channelMap = {} // Map channels IDs to events
    debug('Connection opening, emitting open')
    this.emit('open')
  }

  onError(error) {
    this.emit('error', error)
  }

  onClose() {
    this.emit('close')
  }

  send(msg) {
    debug('Sending %j', msg)
    this.ws.send(JSON.stringify(msg))
  }

  subscribeOrderBook(pair, precision, length) {
    pair = pair || 'tBTCUSD'
    precision = precision || 'P0'
    length = length || '25'
    this.send({
      event: 'subscribe',
      channel: 'book',
      pair: pair,
      prec: precision,
    })
  }

  subscribeTrades(pair) {
    pair = pair || 'BTCUSD'
    this.send({
      event: 'subscribe',
      channel: 'trades',
      pair: pair
    })
  }

  subscribeTicker(pair) {
    pair = pair || 'BTCUSD'
    console.log(pair)
    this.send({
      event: 'subscribe',
      channel: 'ticker',
      pair: pair
    })
  }

  unsubscribe(chanId) {
    this.send({
      event: 'unsubscribe',
      chanId: chanId
    })
  }

  submitOrder(order){
    this.send(order)
  }

  cancelOrder(order_id) {
    this.send([0, "oc", null, { id: order_id }])
  }

  config(flags) {
    this.send({ "event": "conf", flags: FLAGS })
  }
 
  auth(calc) {
    calc = calc || 0
    let authNonce = (new Date()).getTime() * 1000
    let payload = 'AUTH' + authNonce + authNonce
    let signature = crypto.createHmac("sha384", this.api_secret).update(payload).digest('hex')
    this.send({
      event: "auth",
      apiKey: this.api_key,
      authSig: signature,
      authPayload: payload,
      authNonce: +authNonce + 1,
      calc: calc
    })
  }
}

module.exports = BitfinexWS2