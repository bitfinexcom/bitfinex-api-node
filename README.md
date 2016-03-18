# Bitfinex Trading API for Node.JS. Bitcoin, Ethereum and Litecoin trading
=========

[![Build Status](https://travis-ci.org/bitfinexcom/bitfinex-api-node.svg?branch=master)](https://travis-ci.org/bitfinexcom/bitfinex-api-node)

A Node.JS reference implementation of the Bitfinex API. See the full docs at <http://bitfinexcom.github.io/bitfinex-api-node/>

* Official implementation
* REST API
* WebSockets API 

## Installation
```bash
  npm install bitfinex-api-node
```

## Usage
```js
var bitfinex-api-node = require('bitfinex-api-node')
  bitfinex-websocket = bitfinex-api-node.websocket,
  bitfinex-rest = bitfinex-api-node.rest;

console.log('bitfinex-api-node', bitfinex-api-node, 'bitfinex-websocket',
    bitfinex-websocket, 'bitfinex-rest', bitfinex-rest);
```

## Tests

```bash
npm test
```

## Contributing

```
In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.
```

## Release History
```
* 0.0.1 Initial release
```
