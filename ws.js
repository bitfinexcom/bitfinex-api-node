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
var BitfinexWS = function (APIKey, APISecret) {
    EventEmitter.call(this);

    this.APIKey = APIKey;
    this.APISecret = APISecret;
    this.ws = new WebSocket(BitfinexWS.WebSocketURI);
    /**
     * @event BitfinexWS#message
     * @type {object}
     */
    this.ws.on('message', this.onMessage.bind(this));
    /**
     * WebSocket connection is open. Ready to send.
     * @event BitfinexWS#open
     */
    this.ws.on('open', this.onOpen.bind(this));
    /**
     * @event BitfinexWS#error
     */
    this.ws.on('error', this.onError.bind(this));
    /**
     * WebSocket connection is closed.
     * @event BitfinexWS#close
     */
    this.ws.on('close', this.onClose.bind(this));
};

util.inherits(BitfinexWS, EventEmitter);

/**
 * @constant
 * @type {String}
 */
BitfinexWS.WebSocketURI = 'wss://api2.bitfinex.com:3000/ws';

BitfinexWS.prototype.onMessage = function (msg, flags) {
    msg = JSON.parse(msg);
    debug('Received message: %j', msg);
    debug('Emmited message event');
    this.emit('message', msg, flags);

    if (!Array.isArray(msg) && msg.event) {
        if (msg.event === 'subscribed') {
            debug('Subscription report received');
            // Inform the user the new event name that will be triggered
            var eventName = msg.pair + '_' + msg.channel; // BTCUSD_trades
            debug('Event name: %s', eventName);
            var data = {
              eventName: eventName,
              channel: msg.channel,
              chanId: msg.chanId,
              pair: msg.pair
            };
            // Save to event map
            this.channelMap[msg.chanId] = data;
            debug('Emitting \'subscribed\' %j', data);
            /**
             * @event BitfinexWS#subscribed
             * @type {object}
             * @property {sting} eventName - Name of the event will be fired
             * @property {string} channel - Channel type
             * @property {string} pair - Currency pair.
             * @property {number} chanId - Channel ID sended by Bitfinex
             */
            this.emit('subscribed', data);
        } else if (msg.event === 'auth' && msg.status !== 'OK') {
            this.emit('error', msg);
            debug('Emitting \'error\' %j', msg);
        } else if (msg.event === 'auth') {
            this.channelMap[msg.chanId] = {
              channel: 'auth'
            };
            debug('Emitting \'%s\' %j', msg.event, msg);
            /**
             * @event BitfinexWS#auth
             */
            this.emit(msg.event, msg);
        } else {
            debug('Emitting \'%s\' %j', msg.event, msg);
            this.emit(msg.event, msg);
        }
    } else {
        debug('Received data from a channel');
        // Firs telement of Array is the channelId, the rest is the info.
        var channelId = msg.shift(); // Pop the first element
        var event = this.channelMap[channelId];
        if (event) {
            debug('Message in \'%s\' channel', event.channel);
            if (event.channel === 'book') {
                this._processBookEvent(msg, event);
            } else if (event.channel === 'trades') {
                this._processTradeEvent(msg, event);
            } else if (event.channel === 'ticker') {
                this._processTickerEvent(msg, event);
            } else if (event.channel === 'auth') {
                this._processUserEvent(msg);
            } else {
                debug('Message in unknown channel');
            }
        }
  }
};

BitfinexWS.prototype._processUserEvent = function (msg) {
    if (msg[0] === 'hb') { // HeatBeart
        debug('Received HeatBeart in user channel');
    } else {
        var event = msg[0];
        var data = msg[1];
        if (Array.isArray(data[0])) {
            data[0].forEach(function (ele) {
                debug('Emitting \'%s\' %j', event, ele);
                this.emit(event, ele);
            });
        } else if (data.length) {
            debug('Emitting \'%s\', %j', event, data);    
            /**
             * position snapshot
             * @event BitfinexWS#ps
             */
            /**
             * new position
             * @event BitfinexWS#pn
             */
            /**
             * position update
             * @event BitfinexWS#pu
             */
            /**
             * position close
             * @event BitfinexWS#pc
             */
            /**
             * wallet snapshot
             * @event BitfinexWS#ws
             */
            /**
             * wallet snapshot
             * @event BitfinexWS#ws
             */
            /**
             * order snapshot
             * @event BitfinexWS#os
             */
            /**
             * new order
             * @event BitfinexWS#on
             */
            /**
             * order update
             * @event BitfinexWS#ou
             */
            /**
             * order cancel
             * @event BitfinexWS#oc
             */
            /**
             * trade executed
             * @event BitfinexWS#te
             */
            /**
             * trade execution update
             * @event BitfinexWS#tu
             */
            // TODO: send Object with key: values
            this.emit(event, data);
        }
    }
};

BitfinexWS.prototype._processTickerEvent = function (msg, event) {
    if (msg[0] === 'hb') { // HeatBeart
        debug('Received HeatBeart in \'%s\'', event.eventName);
    } else if (msg.length > 9) { // Update
        var update = {
            bid:              msg[0],
            bidSize:          msg[1],
            ask:              msg[2],
            askSize:          msg[3],
            dailyChange:      msg[4],
            dailyChangePerc:  msg[5],
            lastPrice:        msg[6],
            volume:           msg[7],
            high:             msg[8],
            low:              msg[9],
        };
        debug('Emitting \'%s\', %j', event.eventName, update);
        /**
         * @event BitfinexWS#PAIRNAME_ticker
         * @type {object}
         * @property {number} bid
         * @property {number} bidSize
         * @property {number} ask
         * @property {number} askSize
         * @property {number} dailyChange
         * @property {number} dailyChangePerc
         * @property {number} lastPrice
         * @property {number} volume
         * @property {number} high
         * @property {number} low
         */
        this.emit(event.eventName, update);
    }
};

BitfinexWS.prototype._processTradeEvent = function (msg, event) {
    // Snapshot
    if (Array.isArray(msg[0])) {
        msg[0].forEach(function (update) {
            update = {
                seq:        update[0],
                timestamp:  update[1],
                price:      update[2],
                amount:     update[3]
            };
            this.emit(event.eventName, update);
            debug('Emitting \'%s\', %j', event.eventName, update);
        }.bind(this));
    } else if (msg[0] === 'hb') { // HeatBeart
        debug('Received HeatBeart in \'%s\'', event.eventName);
    } else if (msg.length > 3) { // Update
        var update = {
            seq:        msg[0],
            timestamp:  msg[1],
            price:      msg[2],
            amount:     msg[3]
        };
        debug('Emitting \'%s\', %j', event.eventName, update);
        /**
         * @event BitfinexWS#PAIRNAME_trades
         * @type {object}
         * @property {string} seq
         * @property {number} timestamp
         * @property {number} price
         * @property {number} amount
         * @see http://docs.bitfinex.com/#trades75
         */
        this.emit(event.eventName, update);
    }
};

BitfinexWS.prototype._processBookEvent = function (msg, event) {
    // Snapshot
    if (Array.isArray(msg[0])) {
        msg[0].forEach(function (update) {
            update = {
                price:  update[0],
                count:  update[1],
                amount: update[2]
            };
            debug('Emitting %s, %j', event.eventName, msg);
            this.emit(event.eventName, update);
        }.bind(this));
    } else if (msg[0] === 'hb') { // HeatBeart
        debug('Received HeatBeart in %s', event.eventName);
    } else if (msg.length > 2) { // Update
        debug('Emitting %s, %j', event.eventName, msg);
        var update = {
            price:  msg[0],
            count:  msg[1],
            amount: msg[2]
        };
        /**
         * @event BitfinexWS#PAIRNAME_book
         * @type {object}
         * @property {string} price
         * @property {number} count
         * @property {number} amount
         * @see http://docs.bitfinex.com/#order-books
         */
        this.emit(event.eventName, update);
    }
};

BitfinexWS.prototype.close = function () {
    this.ws.close();
};

BitfinexWS.prototype.onOpen = function () {
    this.channelMap = {}; // Map channels IDs to events
    this.emit('open');
};

BitfinexWS.prototype.onError = function (error) {
    this.emit('error', error);
};

BitfinexWS.prototype.onClose = function () {
    this.emit('close');
};

BitfinexWS.prototype.send = function (msg) {
    debug('Sending %j', msg);
    this.ws.send(JSON.stringify(msg));
};

/**
 * Subscribe to Order book updates. Snapshot will be sended as multiple updates.
 * Event will be emited as `PAIRNAME_book`.
 * @param  {string} [pair]      BTCUSD, LTCUSD or LTCBTC. Default BTCUSD
 * @param  {string} [precision] Level of price aggregation (P0, P1, P2, P3).
 *                              The default is P0.
 * @param  {string} [length]    Number of price points. 25 (default) or 100.
 * @see http://docs.bitfinex.com/#order-books
 */
BitfinexWS.prototype.subscribeOrderBook = function (pair, precision, length) {
    pair = pair || 'BTCUSD';
    precision = precision || 'P0';
    length = length || '25';
    
    this.send({
        event: 'subscribe',
        channel: 'book',
        pair: pair,
        prec: precision,
    });
};

/**
 * Subscribe to trades. Snapshot will be sended as multiple updates.
 * Event will be emited as `PAIRNAME_trades`.
 * @param  {string} [pair]      BTCUSD, LTCUSD or LTCBTC. Default BTCUSD
 * @see http://docs.bitfinex.com/#trades75
 */
BitfinexWS.prototype.subscribeTrades = function (pair) {
    pair = pair || 'BTCUSD';
    
    this.send({
        event: 'subscribe',
        channel: 'trades',
        pair: pair
    });
};

/**
 * Subscribe to ticker updates. The ticker is a high level overview of the state
 * of the market. It shows you the current best bid and ask, as well as the last
 * trade price.
 * 
 * Event will be emited as `PAIRNAME_ticker`.
 * @param  {string} [pair]      BTCUSD, LTCUSD or LTCBTC. Default BTCUSD
 * @see http://docs.bitfinex.com/#ticker76
 */
BitfinexWS.prototype.subscribeTicker = function (pair) {
    pair = pair || 'BTCUSD';
    
    this.send({
        event: 'subscribe',
        channel: 'ticker',
        pair: pair
    });
};

/**
 * Unsubscribe to a channel.
 * @param  {number} chanId ID of the channel received on `subscribed` event.
 */
BitfinexWS.prototype.unsubscribe = function (chanId) {
    this.send({
        event: 'unsubscribe',
        chanId: chanId
    });
};

/**
 * Autenticate the user. Will receive executed traded updates.
 * @see http://docs.bitfinex.com/#wallet-updates
 */
BitfinexWS.prototype.auth = function () {
    var payload = 'AUTH' + (new Date().getTime());
    var signature = crypto.createHmac('sha384', this.APISecret)
    .update(payload)
    .digest('hex');
    this.send({
        event: 'auth',
        apiKey: this.APIKey,
        authSig: signature,
        authPayload: payload
    });
};

module.exports = BitfinexWS;
