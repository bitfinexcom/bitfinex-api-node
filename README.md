# Bitfinex Trading API for Node.JS. Bitcoin, Ether and Litecoin trading

[![Build Status](https://travis-ci.org/bitfinexcom/bitfinex-api-node.svg?branch=master)](https://travis-ci.org/bitfinexcom/bitfinex-api-node)

A Node.JS reference implementation of the Bitfinex API

* Official implementation
* REST v2 API
* WebSockets v2 API

Documentation at [https://docs.bitfinex.com/v2/reference](https://docs.bitfinex.com/v2/reference)

## Installation
```bash
  npm i bitfinex-api-node
```

See `doc/` for REST2 and WS2 API methods.

## Usage

Version 2.0.0 of `bitfinex-api-node` supports the v2 REST and WebSocket APIs. The clients for v1 of those APIs are maintained for backwards compatibility, but deprecated.

To minimize the data sent over the network the transmitted data is structured in arrays. In order to reconstruct key / value pairs, set `opts.transform` to `true` when creating an interface.

The BFX constructor returns a client manager, which can be used to create clients for v1 & v2 of the REST and WebSocket APIs via `.rest()` and `.ws()`. The options for the clients can be defined here, or passed in later

```js
const BFX = require('bitfinex-api-node')

const bfx = new BFX({
  apiKey: '...',
  apiSecret: '...',

  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
})
```

The clients are cached per version/options pair, and default to version 2:

```js
let ws2 = bfx.ws() //
ws2 = bfx.ws(2)    // same client
const ws1 = bfx.ws(1)

const rest2 = bfx.rest(2, {
  // options
})
```

The websocket client is recommended for receiving realtime data & notifications
on completed actions.

For more examples, check the `examples/` folder.

### NOTE: v1 REST and WS clients

Both v1 client classes & server APIs have been deprecated, and will be removed. In the meantime, some methods available via `RESTv1` have been exposed on `RESTv2` to prevent future migration issues. Although the underlying implementation of these methods is likely to change once they are fully ported to v2, the signatures should remain the same.

## WS2 Example: Sending an order & tracking status

```js
const ws = bfx.ws()

ws.on('error', (err) => console.log(err))
ws.on('open', ws.auth.bind(ws))

ws.once('auth', () => {
  const o = new Order({
    cid: Date.now(),
    symbol: 'tETHUSD',
    amount: 0.1,
    type: Order.type.MARKET
  }, ws)

  // Enable automatic updates
  o.registerListeners()

  o.on('update', () => {
    console.log(`order updated: ${o.serialize()}`)
  })

  o.on('close', () => {
    console.log(`order closed: ${o.status}`)
    ws.close()
  })

  o.submit().then(() => {
    console.log(`submitted order ${o.id}`)
  }).catch((err) => {
    console.error(err)
    ws.close()
  })
})

ws.open()
```

## WS2 Example: Cancel all open orders

```js
const ws = bfx.ws()

ws.on('error', (err) => console.log(err))
ws.on('open', ws.auth.bind(ws))

ws.onOrderSnapshot({}, (orders) => {
  if (orders.length === 0) {
    console.log('no open orders')
    return
  }

  console.log(`recv ${orders.length} open orders`)

  ws.cancelOrders(orders).then(() => {
    console.log('cancelled orders')
  })
})

ws.open()
```

## WS2 Example: Subscribe to trades by pair

```js
const ws = bfx.ws()

ws.on('error', (err) => console.log(err))
ws.on('open', () => {
  ws.subscribeTrades('BTCUSD')
})

ws.onTrades({ pair: 'BTCUSD' }, (trades) => {
  console.log(`trades: ${JSON.stringify(trades)}`)
})
ws.onTradeEntry({ pair: 'BTCUSD' }, (trades) => {
  console.log(`te: ${JSON.stringify(trades)}`)
})
ws.onTradeUpdate({ pair: 'BTCUSD' }, (trades) => {
  console.log(`tu: ${JSON.stringify(trades)}`)
})

ws.open()
```

## Version 2.0.0 Breaking changes:

### constructor takes only an options object now, including the API keys.

Old:

```js
new BFX(API_KEY, API_SECRET, { version: 2 })
```

since 2.0.0:

```js
new BFX({ apiKey: '', apiSecret: '' })
```

### `trade` and `orderbook` snapshots are emitted as nested lists

To make dealing with snapshots better predictable, snapshots are emitted as an array.

### normalized orderbooks for R0

Lists of raw orderbooks (`R0`) are ordered in the same order as `P0`, `P1`, `P2`, `P3`

## Testing

```bash
npm test
```

## FAQ

### How many orders can I send?

The base limit per-user is 1,000 orders per 5 minute interval, and is shared between all account API connections. It increases proportionally to your trade volume based on the following formula:

`1000 + (TOTAL_PAIRS_PLATFORM * 60 * 5) / (250000000 / USER_VOL_LAST_30d)`

Where `TOTAL_PAIRS_PLATFORM` is the number of pairs shared between Ethfinex/Bitfinex (currently ~101) and `USER_VOL_LAST_30d` is in USD.

### Will I always receive an `on` packet?

No; if your order fills immediately, the first packet referencing the order will be an `oc` signaling the order has closed. If the order fills partially immediately after creation, an `on` packet will arrive with a status of `PARTIALLY FILLED...`

For example, if you submit a `LIMIT` buy for 0.2 BTC and it is added to the order book, an `on` packet will arrive via ws2. After a partial fill of 0.1 BTC, an `ou` packet will arrive, followed by a final `oc` after the remaining 0.1 BTC fills.

On the other hand, if the order fills immediately for 0.2 BTC, you will only receive an `oc` packet.

### My websocket won't connect!

Did you call `open()`? :)

### nonce too small

I make multiple parallel request and I receive an error that the nonce is too small. What does it mean?

Nonces are used to guard against replay attacks. When multiple HTTP requests arrive at the API with the wrong nonce, e.g. because of an async timing issue, the API will reject the request.

If you need to go parallel, you have to use multiple API keys right now.

### How do `te` and `tu` messages differ?

A `te` packet is sent first to the client immediately after a trade has been matched & executed, followed by a `tu` message once it has completed processing. During times of high load, the `tu` message may be noticably delayed, and as such only the `te` message should be used for a realtime feed.

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
 - Cris Mihalache &lt;me@f3rno.com&gt;
