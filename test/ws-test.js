"use strict";

var expect = require('chai').expect;
var BFX = require('../index');
var _ = require('lodash');
var test_keys = require('./keys.json');

describe('WebSocket', function () {
    this.timeout(3000);

    beforeEach(function () {
        var bitfinex = new BFX(test_keys.standard.api_key,
        test_keys.standard.api_secret);
        this.bitfinexWS = bitfinex.ws;
        // this.bitfinexWS.on('open', done);
    });

    afterEach(function (done) {
        this.bitfinexWS.close();
        this.bitfinexWS.on('close', function () {
            done();
        });
    });

    it('should receive a pong after a ping', function (done) {
        this.bitfinexWS.on('pong', function () {
            done();
        });
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.send({event: 'ping'});
        }.bind(this));
    });

    it('should receive a subscribed success messages', function (done) {
        this.bitfinexWS.on('subscribed', function (data) {
            expect(data).to.have.property('channel', 'trades');
            expect(data).to.have.property('pair', 'BTCUSD');
            done();
        });
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.subscribeTrades('BTCUSD');
        }.bind(this));
    });

    it('should receive a pong after a ping', function (done) {
        this.bitfinexWS.on('pong', function () {
            done();
        });
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.send({event: 'ping'});
        }.bind(this));
    });

    it('should receive info message', function (done) {
        this.bitfinexWS.on('info', function (data) {
            expect(data).is.eql({
                event: 'info',
                version: 1.1
            });
            done();
        });
    });


    it('#orderBook data should have the defined fields', function (done) {
        this.bitfinexWS.once('orderbook', function (pair, data) {
            expect(pair).to.equal('BTCUSD');
            expect(data.price).to.be.a('number');
            expect(data.count).to.be.a('number');
            expect(data.amount).to.be.a('number');
            done();
        }.bind(this));
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.subscribeOrderBook('BTCUSD');
        }.bind(this));
    });

    it('#trade data should have the defined fields', function (done) {
        this.bitfinexWS.once('trade', function (pair, data) {
            expect(pair).to.equal('BTCUSD');
            expect(data.seq).to.be.a('number');
            expect(data.timestamp).to.be.a('number');
            expect(data.price).to.be.a('number');
            expect(data.amount).to.be.a('number');
            done();
        }.bind(this));
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.subscribeTrades('BTCUSD');
        }.bind(this));
    });

    it('#ticker data should have the defined fields', function (done) {
        this.bitfinexWS.once('ticker', function (pair, data) {
            expect(pair).to.equal('BTCUSD');
            expect(data.bid).to.be.a('number');
            expect(data.bidSize).to.be.a('number');
            expect(data.ask).to.be.a('number');
            expect(data.askSize).to.be.a('number');
            expect(data.dailyChange).to.be.a('number');
            expect(data.dailyChangePerc).to.be.a('number');
            expect(data.lastPrice).to.be.a('number');
            expect(data.volume).to.be.a('number');
            expect(data.high).to.be.a('number');
            expect(data.low).to.be.a('number');
            done();
        }.bind(this));
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.subscribeTicker('BTCUSD');
        }.bind(this));
    });

    it('should unsubscribe by channelId', function (done) {
        this.bitfinexWS.once('subscribed', function (data) {
            var channelId = data.chanId;
            this.bitfinexWS.once('unsubscribed', function (data) {
                expect(data.status).to.equal('OK');
                expect(data.chanId).to.equal(channelId);
                done();
            });
            this.bitfinexWS.unsubscribe(channelId);
        }.bind(this));
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.subscribeTicker('BTCUSD');
        }.bind(this));
    });

    // FIXME: The API key in keys.json is invalid, causing this test to fail.
    xit('should emit an auth event when authorized', function (done) {
        this.bitfinexWS.on('auth', function (data) {
            expect(data.status).to.equal('OK');
            done();
        });
        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.auth();
        }.bind(this));
    });

    it('should emit an error when authorization fails', function (done) {
        this.bitfinexWS.APIKey = '';
        this.bitfinexWS.APISecret = '';

        this.bitfinexWS.on('error', function (error) {
            done();
        });

        this.bitfinexWS.on('open', function () {
            this.bitfinexWS.auth();
        }.bind(this));
    });

});
