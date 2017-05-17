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

Version 1.0.0 supports the new v2 Websocket and Rest API. As Network calls are slow, the data is sent as lists.

In order to reconstruct key / value pairs, set `opts.transform` to `true`.

```js
const BFX = require('bitfinex-api-node')

const API_KEY = 'secret'
const API_SECRET = 'secret'

const opts = {
  version: 2,
  transform: true
}

const bws = new BFX(API_KEY, API_SECRET, opts).ws

bws.on('open', () => {
  bws.subscribeTicker('BTCUSD')
  bws.subscribeOrderBook('BTCUSD')
  bws.subscribeTrades('BTCUSD')
})

bws.on('orderbook', (pair, book) => {
  console.log('Order book:', book)
})

bws.on('trade', (pair, trade) => {
  console.log('Trade:', trade)
})

bws.on('ticker', (pair, ticker) => {
  console.log('Ticker:', ticker)
})

bws.on('error', console.error)
```

## new BFX(API_KEY, API_SECRET, opts)

Where opts can be:

```
const opts = {
  // use v1 or v2 of the API, values: 1, 2
  version: 2,
  // transform lists for the v2 API. values: true, false, function
  transform: true
}
```

## Version 1.0.0 Breaking changes:

### constructor takes an options object now, instead of version number:

Old:

```js
new BFX(API_KEY, API_SECRET, 2)
```

since 1.0.0:

```js
new BFX(API_KEY, API_SECRET, { version: 2 })
```
**Note** version must be of type `Number`.


## Tests

```bash
npm test
```

## Contributing

```
We are following the [standard JavaScript Style Guide](https://github.com/feross/standard).
Add unit tests for any new or changed functionality. Lint and test your code.
```

## Release History
```
* 0.0.1 Initial release
* 0.3.0 Added support for v2 API
```
