# Bitfinex Trading API for Node.JS. Bitcoin, Ether and Litecoin trading

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

bws.on('auth', () => {
  // emitted after .auth()
  // needed for private api endpoints

  console.log('authenticated')
  // bws.submitOrder ...
})

bws.on('open', () => {
  bws.subscribeTicker('BTCUSD')
  bws.subscribeOrderBook('BTCUSD')
  bws.subscribeTrades('BTCUSD')

  // authenticate
  // bws.auth()
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

### `trade` and `orderbook` snapshots are emitted as nested lists

To make dealing with snapshots better predictable, snapshots are emitted as an array.

### normalized orderbooks for R0

Lists of raw orderbooks (`R0`) are ordered in the same order as `P0`, `P1`, `P2`, `P3`


## Tests

```bash
npm test
```

## FAQ

### nonce too small

I make multiple parallel request and I receive an error that the nonce is too small. What does it mean?

Nonces are used to guard against replay attacks. When multiple HTTP requests arrive at the API with the wrong nonce, e.g. because of an async timing issue, the API will reject the request.

If you need to go parallel, you have to use multiple API keys right now.

## Contributors

 - Josh Rossi &lt;maximojoshuarossi@gmail.com&gt;
 - Yago &lt;yago.ftw@gmail.com&gt;
 - Sean Robertson &lt;sprobertson@gmail.com&gt;
 - Paolo Ardoino &lt;paolo.ardoino@gmail.com&gt;
 - Aaron Terry &lt;acterry@gmail.com&gt;
 - Zachary Belford &lt;belfordz66@gmail.com&gt;
 - Robert Kowalski &lt;rok@kowalski.gd&gt;
 - Simone Poggi &lt;motocarota@gmail.com&gt;
 - Matthew Jesuele &lt;matt@makeapps.io&gt;
 - dutu &lt;adrian.clinciu@outlook.com&gt;
 - Tetradeca &lt;31027443+Tetradeca@users.noreply.github.com&gt;
 - Cameron Lockey &lt;ctlockey@gmail.com&gt;
 - Andrew &lt;androng@users.noreply.github.com&gt;
 - Rob Ellis &lt;rob@silentrob.me&gt;
 - MaxSvargal &lt;maxsvargal@gmail.com&gt;
