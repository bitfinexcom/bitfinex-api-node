# Bitfinex WSv2 Trading API for Node.J - Bitcoin, Ethereum, Ripple and more

[![Build Status](https://travis-ci.org/bitfinexcom/bitfinex-api-node.svg?branch=master)](https://travis-ci.org/bitfinexcom/bitfinex-api-node)

A Node.JS reference implementation of the Bitfinex API

### Features

* Official implementation
* REST v2 API
* WebSockets v2 API
* WebSockets v1 API


## Installation
```bash
  npm i --save bitfinex-api-node
```

### Quickstart

```js
const { WSv2 } = require('bitfinex-api-node')
const ws = new WSv2({ transform: true })

// do something with ws client
```

### Docs

[See `docs/ws2.md`](/docs/ws2.md) for WS2 API methods, [and `docs/usage.md`](/docs/usage.md) for a basic usage guide. For executable examples, [refer to the `examples/`](/examples) folder.

Official API documentation at [https://docs.bitfinex.com/v2/reference](https://docs.bitfinex.com/v2/reference)

### Examples

Sending an order & tracking status:
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

Cancel all open orders
```js
const ws = bfx.ws(2)

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

Subscribe to trades by pair
```js
const ws = bfx.ws(2)

ws.on('error', (err) => console.log(err))
ws.on('open', () => {
  ws.subscribeTrades('BTCUSD')
})

ws.onTrades({ symbol: 'tBTCUSD' }, (trades) => {
  console.log(`trades: ${JSON.stringify(trades)}`)
})
ws.onTradeEntry({ symbol: 'tBTCUSD' }, (trades) => {
  console.log(`te: ${JSON.stringify(trades)}`)
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

### What are the sequence numbers for?

If you enable sequencing on v2 of the WS API, each incoming packet will have a public sequence number at the end, along with an auth sequence number in the case of channel `0` packets. The public seq numbers increment on each packet, and the auth seq numbers increment on each authenticated action (new orders, etc). These values allow you to verify that no packets have been missed/dropped, since they always increase monotonically.

### What is the difference between R* and P* order books?

Order books with precision `R0` are considered 'raw' and contain entries for each order submitted to the book, whereas `P*` books contain entries for each price level (which aggregate orders).

### Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request
