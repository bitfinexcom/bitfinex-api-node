'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')('bitfinex:ws')
const WebSocket = require('ws')

const { isSnapshot, genAuthSig } = require('../util')

const WS_URL = 'wss://api.bitfinex.com/ws/'

/**
 * Communicates with v1 of the Bitfinex WebSocket API
 */
class WSv1 extends EventEmitter {
  /**
   * @param {sting} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.url - ws connection url
   */
  constructor (opts = { apiKey: '', apiSecret: '', url: WS_URL }) {
    super()

    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._url = opts.url || WS_URL
    this._channelMap = {} // map channel IDs to events
  }

  open () {
    this._ws = new WebSocket(this._url)

    this._ws.on('message', this._onWSMessage.bind(this))
    this._ws.on('open', this._onWSOpen.bind(this))
    this._ws.on('error', this._onWSError.bind(this))
    this._ws.on('close', this._onWSClose.bind(this))
  }

  _onWSMessage (msgJSON, flags) {
    let msg

    try {
      msg = JSON.parse(msgJSON)
    } catch (e) {
      debug('[bfx ws2 error] received invalid json')
      debug('[bfx ws2 error] %j', msgJSON)
      return
    }

    debug('Received message: %j', msg)
    this.emit('message', msg, flags)
    debug('Emmited message event')

    // Drop out early if channel data
    if (Array.isArray(msg) || !msg.event) {
      return this._handleChannel(msg)
    }

    if (msg.event === 'subscribed') {
      debug('Subscription report received')
      this._channelMap[msg.chanId] = msg
    } else if (msg.event === 'auth') {
      if (msg.status !== 'OK') {
        debug('Emitting \'error\' %j', msg)
        this.emit('error', msg)
        return
      }

      this._channelMap[msg.chanId] = { channel: 'auth' }
    }

    debug('Emitting \'%s\' %j', msg.event, msg)
    this.emit(msg.event, msg)
  }

  _handleChannel (msg) {
    // First element of Array is the channelId, the rest is the info.
    const channelId = msg.shift() // Pop the first element
    const event = this._channelMap[channelId]

    if (msg[0] === 'hb') {
      return debug(`received heartbeat in ${event.channel}`)
    }

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

  _processUserEvent (msg) {
    const event = msg[0]
    const data = msg[1]

    if (Array.isArray(data[0])) {
      data[0].forEach((ele) => {
        debug('Emitting \'%s\' %j', event, ele)
        this.emit(event, ele)
      })
    } else if (data.length) {
      debug('Emitting \'%s\', %j', event, data)
      this.emit(event, data)
    }
  }

  _processTickerEvent (msg, event) {
    if (msg.length > 9) { // Update
      // All values are numbers
      const update = {
        bid: msg[0],
        bidSize: msg[1],
        ask: msg[2],
        askSize: msg[3],
        dailyChange: msg[4],
        dailyChangePerc: msg[5],
        lastPrice: msg[6],
        volume: msg[7],
        high: msg[8],
        low: msg[9]
      }

      debug('Emitting ticker, %s, %j', event.pair, update)
      this.emit('ticker', event.pair, update)
    }
  }

  _processTradeEvent (msg, event) {
    if (isSnapshot(msg)) {
      const snapshot = msg[0].map(el => ({
        seq: el[0],
        timestamp: el[1],
        price: el[2],
        amount: el[3]
      }))

      debug('Emitting trade snapshot, %s, %j', event.pair, snapshot)
      this.emit('trade', event.pair, snapshot)
      return
    }

    if (msg[0] !== 'te' && msg[0] !== 'tu') return

    // seq is a string, other payload members are nums
    const update = { seq: msg[1] }

    if (msg[0] === 'te') { // Trade executed
      update.timestamp = msg[2]
      update.price = msg[3]
      update.amount = msg[4]
    } else { // Trade updated
      update.id = msg[2]
      update.timestamp = msg[3]
      update.price = msg[4]
      update.amount = msg[5]
    }

    // See http://docs.bitfinex.com/#trades75
    debug('Emitting trade, %s, %j', event.pair, update)
    this.emit('trade', event.pair, update)
  }

  _processBookEvent (msg, event) {
    // TODO: Maybe break this up into snapshot/normal handlers? Also trade event
    if (!isSnapshot(msg[0]) && msg.length > 2) {
      let update

      if (event.prec === 'R0') {
        update = {
          price: msg[1],
          orderId: msg[0],
          amount: msg[2]
        }
      } else {
        update = {
          price: msg[0],
          count: msg[1],
          amount: msg[2]
        }
      }

      debug('Emitting orderbook, %s, %j', event.pair, update)
      this.emit('orderbook', event.pair, update)
      return
    }

    msg = msg[0]

    if (isSnapshot(msg)) {
      const snapshot = msg.map((el) => {
        if (event.prec === 'R0') {
          return {
            orderId: el[0],
            price: el[1],
            amount: el[2]
          }
        }

        return {
          price: el[0],
          count: el[1],
          amount: el[2]
        }
      })

      debug('Emitting orderbook snapshot, %s, %j', event.pair, snapshot)
      this.emit('orderbook', event.pair, snapshot)
    }
  }

  close () {
    this._ws.close()
  }

  _onWSOpen () {
    this._channelMap = {}
    this.emit('open')
  }

  _onWSError (error) {
    this.emit('error', error)
  }

  _onWSClose () {
    this.emit('close')
  }

  send (msg) {
    debug('Sending %j', msg)
    this._ws.send(JSON.stringify(msg))
  }

  /**
   * Subscribe to order book updates. Snapshot will be sent as multiple updates.
   * Event will be emited as `PAIRNAME_book`.
   *
   * @param {string} pair - BTCUSD, LTCUSD or LTCBTC. Default BTCUSD
   * @param {string} precision - price aggregation level (P0 (def), P1, P2, P3)
   * @param {string} length - number of price points. 25 (default) or 100.
   * @see http://docs.bitfinex.com/#order-books
   */
  subscribeOrderBook (pair = 'BTCUSD', prec = 'P0', len = '25') {
    this.send({
      event: 'subscribe',
      channel: 'book',
      pair,
      prec,
      len
    })
  }

  /**
   * Subscribe to trades. Snapshot will be sent as multiple updates.
   * Event will be emited as `PAIRNAME_trades`.
   *
   * @param {string} pair - BTCUSD, LTCUSD or LTCBTC. Default BTCUSD
   * @see http://docs.bitfinex.com/#trades75
   */
  subscribeTrades (pair = 'BTCUSD') {
    this.send({
      event: 'subscribe',
      channel: 'trades',
      pair
    })
  }

  /**
   * Subscribe to ticker updates. The ticker is a high level overview of the
   * state of the market. It shows you the current best bid and ask, as well as
   * the last trade price.
   *
   * Event will be emited as `PAIRNAME_ticker`.
   *
   * @param {string} - pair BTCUSD, LTCUSD or LTCBTC. Default BTCUSD
   * @see http://docs.bitfinex.com/#ticker76
   */
  subscribeTicker (pair = 'BTCUSD') {
    this.send({
      event: 'subscribe',
      channel: 'ticker',
      pair
    })
  }

  /**
   * Unsubscribe from a channel.
   *
   * @param {number} chanId - ID of the channel received on `subscribed` event
   */
  unsubscribe (chanId) {
    this.send({
      event: 'unsubscribe',
      chanId
    })
  }

  /**
   * Authenticate the user. Will receive executed traded updates.
   *
   * @see http://docs.bitfinex.com/#wallet-updates
   */
  auth () {
    const { sig, payload } = genAuthSig(this._apiSecret)

    this.send({
      event: 'auth',
      apiKey: this._apiKey,
      authSig: sig,
      authPayload: payload
    })
  }
}

module.exports = WSv1
