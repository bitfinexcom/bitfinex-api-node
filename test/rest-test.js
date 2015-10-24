var expect = require('chai').expect,
    BFX = require('../index'),
    keys = require('./keys.json');

describe("Public Endpoints", function(){
    before(function() {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
    it("should get a ticker with no args");
    it("should get a ticker with an arg");
    it("should get the stats");
    it("should get the fundingbook");
    it("should get the orderbook");
    it("should get recent trades");
    it("should get recent lends");
    it("should get symbols");
    it("should get symbol details");
});
describe("Authenticated Endpoints - standard key", function(){
    before(function() {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
    it("should get account info");
    it("should get a deposit address");
    describe("orders", function(){
        it("should place a new order");
        it("should place multiple orders");
        it("should cancel an order");
        it("should cancel multiple orders");

    });
});
describe("Authenticated Endpoints: read-only key", function(){
    before(function() {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
});
describe("Authenticated Endpoints: withdrawal-enabled key", function(){
    before(function() {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
});