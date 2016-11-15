'use strict';

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('bitfinex:ws');
var crypto = require('crypto');
var WebSocket = require('ws');
var util = require('util');

/**
 * Handles communitaction with Bitfinex WebSocket API.
 * @param {sting} APIKey
 * @param {string} APISecret
 * @event
 * @class
 */
class BitfinexWS extends EventEmitter {
  constructor(api_key, api_secret) {
    super()
    EventEmitter.call(this);
    this.api_key = api_key
    this.api_secret = api_secret
    this.websocketURI = 'wss://api.bitfinex.com/ws/2'

    this.ws = new WebSocket(this.WebSocketURI)
  }
  
  onMessage() {}

  _processUserEvent() {}

  _processBookEvent() {}

  _processTradeEvent() {}

  close() {}

  onOpen() {}

  onError() {}

  subscribeOrderBook() {}

  subscribeTrades() {}

  subscribeTicker() {}

  unsubscribe() {}

  auth() {}
}