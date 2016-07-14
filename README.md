# Bitfinex Trading API for Node.JS. Bitcoin, Ether and Litecoin trading
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
var bitfinexApiNode = require('bitfinex-api-node')
  bitfinexWebsocket = bitfinexApiNode.websocket,
  bitfinexRest = bitfinexApiNode.rest;

console.log('bitfinexApiNode', bitfinexApiNode, 'bitfinexWebsocket',
    bitfinexWebsocket, 'bitfinexRest', bitfinexRest);
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
