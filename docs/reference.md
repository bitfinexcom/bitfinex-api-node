## Modules

<dl>
<dt><a href="#module_bitfinex-api-node">bitfinex-api-node</a></dt>
<dd><p>A Node.JS reference implementation of the Bitfinex API</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#ClientManager">ClientManager</a></dt>
<dd><p>Provides access to versions 1 &amp; 2 of the HTTP &amp; WebSocket Bitfinex APIs.</p>
</dd>
<dt><a href="#WS2Manager">WS2Manager</a> ⇐ <code>events.EventEmitter</code></dt>
<dd><p>Provides a wrapper around the WSv2 class, opening new sockets when a
subscription would push a single socket over the data channel limit.</p>
<p>For more complex operations, grab a socket reference with getSocket() or
getFreeDataSocket(), or create a new WSv2 instance manually</p>
</dd>
<dt><a href="#WSv2">WSv2</a> ⇐ <code>events.EventEmitter</code></dt>
<dd><p>Communicates with v2 of the Bitfinex WebSocket API</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CandleChannel">CandleChannel</a> : <code>object</code></dt>
<dd><p>An object describing a trade data channel on a <a href="#WSv2">WSv2</a> data stream.</p>
</dd>
<dt><a href="#OrderBookChannel">OrderBookChannel</a> : <code>object</code></dt>
<dd><p>An object describing an order book data channel on a WSv2 data stream.</p>
</dd>
<dt><a href="#TickerChannel">TickerChannel</a> : <code>object</code></dt>
<dd><p>An object describing a ticker data channel on a WSv2 data stream.</p>
</dd>
<dt><a href="#TradeChannel">TradeChannel</a> : <code>object</code></dt>
<dd><p>An object describing a trade data channel on a WSv2 data stream.</p>
</dd>
</dl>

<a name="module_bitfinex-api-node"></a>

## bitfinex-api-node
A Node.JS reference implementation of the Bitfinex API

**License**: MIT  
**Example** *(sending an order &amp; tracking status)*  
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
**Example** *(cancel all open orders)*  
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
**Example** *(subscribe to trades by pair)*  
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
<a name="ClientManager"></a>

## ClientManager
Provides access to versions 1 & 2 of the HTTP & WebSocket Bitfinex APIs.

**Kind**: global class  
**See**: [WSv2](#WSv2)  

* [ClientManager](#ClientManager)
    * [new ClientManager(opts)](#new_ClientManager_new)
    * [.rest([version], [extraOpts])](#ClientManager+rest) ⇒ <code>bfx-api-node-rest.RESTv1</code> \| <code>bfx-api-node-rest.RESTv2</code>
    * [.ws([version], [extraOpts])](#ClientManager+ws) ⇒ [<code>WSv2</code>](#WSv2) \| <code>bfx-api-node-ws1.WSv1</code>

<a name="new_ClientManager_new"></a>

### new ClientManager(opts)

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.apiKey | <code>string</code> | API key |
| opts.apiSecret | <code>string</code> | API secret |
| opts.authToken | <code>string</code> | optional auth option |
| opts.transform | <code>string</code> | if true, packets are converted to models |
| opts.nonceGenerator | <code>string</code> | optional |
| opts.ws | [<code>Configuration</code>](#WSv2..Configuration) | ws transport options |
| opts.rest | <code>string</code> | rest transport options |

<a name="ClientManager+rest"></a>

### clientManager.rest([version], [extraOpts]) ⇒ <code>bfx-api-node-rest.RESTv1</code> \| <code>bfx-api-node-rest.RESTv2</code>
Returns a new REST API class instance (cached by version)

**Kind**: instance method of [<code>ClientManager</code>](#ClientManager)  
**Returns**: <code>bfx-api-node-rest.RESTv1</code> \| <code>bfx-api-node-rest.RESTv2</code> - transport  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [version] | <code>number</code> | <code>2</code> | 1 or 2 |
| [extraOpts] | <code>object</code> | <code>{}</code> | passed to transport constructor |

<a name="ClientManager+ws"></a>

### clientManager.ws([version], [extraOpts]) ⇒ [<code>WSv2</code>](#WSv2) \| <code>bfx-api-node-ws1.WSv1</code>
Returns a new WebSocket API class instance (cached by version)

**Kind**: instance method of [<code>ClientManager</code>](#ClientManager)  
**Returns**: [<code>WSv2</code>](#WSv2) \| <code>bfx-api-node-ws1.WSv1</code> - transport  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [version] | <code>number</code> | <code>2</code> | 1 or 2 |
| [extraOpts] | [<code>Configuration</code>](#WSv2..Configuration) | <code>{}</code> | passed to transport   constructor |

<a name="WS2Manager"></a>

## WS2Manager ⇐ <code>events.EventEmitter</code>
Provides a wrapper around the WSv2 class, opening new sockets when a
subscription would push a single socket over the data channel limit.

For more complex operations, grab a socket reference with getSocket() or
getFreeDataSocket(), or create a new WSv2 instance manually

**Kind**: global class  
**Extends**: <code>events.EventEmitter</code>  

* [WS2Manager](#WS2Manager) ⇐ <code>events.EventEmitter</code>
    * [new WS2Manager(socketArgs, [authArgs])](#new_WS2Manager_new)
    * _instance_
        * [.setAuthArgs(args)](#WS2Manager+setAuthArgs)
        * [.getAuthArgs()](#WS2Manager+getAuthArgs) ⇒ <code>object</code>
        * [.reconnect()](#WS2Manager+reconnect) ⇒ <code>Promise</code>
        * [.close()](#WS2Manager+close) ⇒ <code>Promise</code>
        * [.getNumSockets()](#WS2Manager+getNumSockets) ⇒ <code>number</code>
        * [.getSocket(i)](#WS2Manager+getSocket) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.getSocketInfo()](#WS2Manager+getSocketInfo) ⇒ <code>Array.&lt;object&gt;</code>
        * [.auth(args)](#WS2Manager+auth)
        * [.openSocket()](#WS2Manager+openSocket) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.getAuthenticatedSocket()](#WS2Manager+getAuthenticatedSocket) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.getFreeDataSocket()](#WS2Manager+getFreeDataSocket) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.getSocketWithDataChannel(type, filter)](#WS2Manager+getSocketWithDataChannel) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.getSocketWithChannel(chanId)](#WS2Manager+getSocketWithChannel) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.getSocketWithSubRef(channel, identifier)](#WS2Manager+getSocketWithSubRef) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
        * [.withAllSockets(cb)](#WS2Manager+withAllSockets)
        * [.subscribe(type, ident, filter)](#WS2Manager+subscribe)
        * [.managedUnsubscribe(channel, identifier)](#WS2Manager+managedUnsubscribe)
        * [.unsubscribe(chanId)](#WS2Manager+unsubscribe)
        * [.subscribeTicker(symbol)](#WS2Manager+subscribeTicker)
        * [.subscribeTrades(symbol)](#WS2Manager+subscribeTrades)
        * [.subscribeOrderBook(symbol, [prec], [len], [freq])](#WS2Manager+subscribeOrderBook)
        * [.subscribeCandles(key)](#WS2Manager+subscribeCandles)
        * [.onCandle(opts, cb)](#WS2Manager+onCandle)
        * [.onOrderBook(opts, cb)](#WS2Manager+onOrderBook)
        * [.onTrades(opts, cb)](#WS2Manager+onTrades)
        * [.onTicker(opts, cb)](#WS2Manager+onTicker)
    * _static_
        * [.getDataChannelCount(s)](#WS2Manager.getDataChannelCount) ⇒ <code>number</code>
    * _inner_
        * [~SocketState](#WS2Manager..SocketState) : <code>object</code>

<a name="new_WS2Manager_new"></a>

### new WS2Manager(socketArgs, [authArgs])

| Param | Type | Description |
| --- | --- | --- |
| socketArgs | [<code>Configuration</code>](#WSv2..Configuration) | passed to [WSv2](#WSv2)   constructor |
| [authArgs] | <code>object</code> | cached for all internal socket auth() calls |
| [authArgs.calc] | <code>object</code> | default 0 |
| [authArgs.dms] | <code>object</code> | default 0 |

**Example**  
```js
const rest = new RESTv2()
const details = await rest.symbolDetails()
const symbols = details.map(d => `t${d.pair.toUpperCase()}`)
const timeFrames = ['1m', '5m', '30m', '1h', '6h']
const keys = _flatten(symbols.map(s => {
  return timeFrames.map(tf => `trade:${tf}:${s}`)
}))

const m = new Manager()

m.on('error', (err) => {
  debug('error: %s', err)
})

m.once('open', () => {
  debug('open')

  keys.forEach(key => {
    m.subscribeCandles(key)
    m.onCandle({ key }, (candles) => {
      debug('recv %d candles on channel %s', candles.length, key)
    })
  })

  symbols.forEach(symbol => {
    m.subscribeTrades(symbol)
    m.onTrades({ symbol }, (trades) => {
      debug('recv %d trades on channel %s', trades.length, symbol)
    })
  })

  symbols.forEach(symbol => {
    m.subscribeTicker(symbol)
    m.onTicker({ symbol }, (ticker) => {
      debug('recv ticker on channel %s: %j', symbol, ticker)
    })
  })

  symbols.forEach(symbol => {
    m.subscribeOrderBook(symbol)
    m.onOrderBook({ symbol }, (update) => {
      debug('recv book update on channel %s: %j', symbol, update)
    })
  })

  setInterval(() => {
    debug('num keys: %d', keys.length)
    debug('num sockets: %d', m.getNumSockets())
    debug('socket info: %j', m.getSocketInfo())
  }, 5000)
})

m.openSocket()
```
<a name="WS2Manager+setAuthArgs"></a>

### wS2Manager.setAuthArgs(args)
Update authentication arguments on all sockets

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | arguments |
| [args.calc] | <code>object</code> | calc value |
| [args.dms] | <code>object</code> | active 4 |

<a name="WS2Manager+getAuthArgs"></a>

### wS2Manager.getAuthArgs() ⇒ <code>object</code>
Retrieve internal authentication arguments

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>object</code> - args  
<a name="WS2Manager+reconnect"></a>

### wS2Manager.reconnect() ⇒ <code>Promise</code>
Reconnects all open sockets

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Promise</code> - p  
<a name="WS2Manager+close"></a>

### wS2Manager.close() ⇒ <code>Promise</code>
Closes all open sockets

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Promise</code> - p  
<a name="WS2Manager+getNumSockets"></a>

### wS2Manager.getNumSockets() ⇒ <code>number</code>
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>number</code> - n  
<a name="WS2Manager+getSocket"></a>

### wS2Manager.getSocket(i) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - state  

| Param | Type | Description |
| --- | --- | --- |
| i | <code>number</code> | index into pool |

<a name="WS2Manager+getSocketInfo"></a>

### wS2Manager.getSocketInfo() ⇒ <code>Array.&lt;object&gt;</code>
Returns an object which can be logged to inspect the socket pool

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Array.&lt;object&gt;</code> - socketInfo  
<a name="WS2Manager+auth"></a>

### wS2Manager.auth(args)
Authenticates all existing & future sockets with the provided credentials.
Does nothing if an apiKey/apiSecret pair are already known.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | arguments |
| args.apiKey | <code>object</code> | saved if not already provided |
| args.apiSecret | <code>object</code> | saved if not already provided |
| [args.calc] | <code>object</code> | default 0 |
| [args.dms] | <code>object</code> | dead man switch, active 4 |

<a name="WS2Manager+openSocket"></a>

### wS2Manager.openSocket() ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
Creates a new socket/state instance and adds it to the internal pool. Binds
event listeners to forward via our own event emitter, and to manage pending
subs/unsubs.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - state  
<a name="WS2Manager+getAuthenticatedSocket"></a>

### wS2Manager.getAuthenticatedSocket() ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - state  
<a name="WS2Manager+getFreeDataSocket"></a>

### wS2Manager.getFreeDataSocket() ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
Returns the first socket that has less active/pending channels than the
DATA_CHANNEL_LIMIT

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - state - undefined if none found  
<a name="WS2Manager+getSocketWithDataChannel"></a>

### wS2Manager.getSocketWithDataChannel(type, filter) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
Returns the first socket that is subscribed/pending sub to the specified
channel.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - wsState -
  undefined if not found  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | i.e. 'book' |
| filter | <code>object</code> | i.e. { symbol: 'tBTCUSD', prec: 'R0' } |

<a name="WS2Manager+getSocketWithChannel"></a>

### wS2Manager.getSocketWithChannel(chanId) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
NOTE: Cannot filter against pending subscriptions, due to unknown chanId

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - wsState -
  undefined if not found  

| Param | Type | Description |
| --- | --- | --- |
| chanId | <code>number</code> | channel ID |

<a name="WS2Manager+getSocketWithSubRef"></a>

### wS2Manager.getSocketWithSubRef(channel, identifier) ⇒ [<code>SocketState</code>](#WS2Manager..SocketState)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: [<code>SocketState</code>](#WS2Manager..SocketState) - wsState -
  undefined if not found  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel type |
| identifier | <code>string</code> | unique channel identifier |

<a name="WS2Manager+withAllSockets"></a>

### wS2Manager.withAllSockets(cb)
Calls the provided cb with all internal socket instances

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback |

<a name="WS2Manager+subscribe"></a>

### wS2Manager.subscribe(type, ident, filter)
Subscribes a free data socket if available to the specified channel, or
opens a new socket & subs if needed.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | i.e. 'book' |
| ident | <code>string</code> | i.e. 'tBTCUSD' |
| filter | <code>object</code> | i.e. { symbol: 'tBTCUSD', prec: 'R0' } |

<a name="WS2Manager+managedUnsubscribe"></a>

### wS2Manager.managedUnsubscribe(channel, identifier)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel type |
| identifier | <code>string</code> | unique channel identifier |

<a name="WS2Manager+unsubscribe"></a>

### wS2Manager.unsubscribe(chanId)
Unsubscribes the first socket w/ the specified channel. Does nothing if no
such socket is found.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| chanId | <code>number</code> | channel ID |

<a name="WS2Manager+subscribeTicker"></a>

### wS2Manager.subscribeTicker(symbol)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol for ticker |

<a name="WS2Manager+subscribeTrades"></a>

### wS2Manager.subscribeTrades(symbol)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol for trades |

<a name="WS2Manager+subscribeOrderBook"></a>

### wS2Manager.subscribeOrderBook(symbol, [prec], [len], [freq])
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | symbol for order book |
| [prec] | <code>string</code> | <code>&quot;P0&quot;</code> | precision, i.e. 'R0', default 'P0' |
| [len] | <code>string</code> | <code>&quot;25&quot;</code> | length, default '25' |
| [freq] | <code>string</code> | <code>&quot;F0&quot;</code> | default 'F0' |

<a name="WS2Manager+subscribeCandles"></a>

### wS2Manager.subscribeCandles(key)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | candle channel key |

<a name="WS2Manager+onCandle"></a>

### wS2Manager.onCandle(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Throws**:

- an error if no data socket is available

**See**: https://docs.bitfinex.com/v2/reference#ws-public-candle  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.key | <code>string</code> | candle set key, i.e. trade:30m:tBTCUSD |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WS2Manager+onOrderBook"></a>

### wS2Manager.onOrderBook(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Throws**:

- an error if no data socket is available

**See**: https://docs.bitfinex.com/v2/reference#ws-public-order-books  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.symbol | <code>string</code> | order book symbol |
| [opts.prec] | <code>string</code> | precision, i.e. 'R0', default 'P0' |
| [opts.len] | <code>string</code> | length, default '25' |
| [opts.freq] | <code>string</code> | default 'F0' |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WS2Manager+onTrades"></a>

### wS2Manager.onTrades(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Throws**:

- an error if no data socket is available

**See**: https://docs.bitfinex.com/v2/reference#ws-public-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol for trades |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WS2Manager+onTicker"></a>

### wS2Manager.onTicker(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Throws**:

- an error if no data socket is available

**See**: https://docs.bitfinex.com/v2/reference#ws-public-ticker  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol for ticker |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WS2Manager.getDataChannelCount"></a>

### WS2Manager.getDataChannelCount(s) ⇒ <code>number</code>
**Kind**: static method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>number</code> - count - # of subscribed/pending data channels  

| Param | Type | Description |
| --- | --- | --- |
| s | [<code>SocketState</code>](#WS2Manager..SocketState) | socket state |

<a name="WS2Manager..SocketState"></a>

### WS2Manager~SocketState : <code>object</code>
Object containing socket state for [WS2Manager](#WS2Manager).

**Kind**: inner typedef of [<code>WS2Manager</code>](#WS2Manager)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| ws | [<code>WSv2</code>](#WSv2) | client instance |
| pendingSubscriptions | <code>Array.&lt;Array&gt;</code> | array of sent but unconfirmed   channel subscriptions |
| pendingUnsubscriptions | <code>Array.&lt;Array&gt;</code> | array of sent but unconfirmed   channel unsubscribe packets |

<a name="WSv2"></a>

## WSv2 ⇐ <code>events.EventEmitter</code>
Communicates with v2 of the Bitfinex WebSocket API

**Kind**: global class  
**Extends**: <code>events.EventEmitter</code>  

* [WSv2](#WSv2) ⇐ <code>events.EventEmitter</code>
    * [new WSv2([config])](#new_WSv2_new)
    * _instance_
        * [.WSv2.flags](#WSv2+WSv2.flags)
        * [.WSv2.info](#WSv2+WSv2.info)
        * [.getURL()](#WSv2+getURL) ⇒ <code>string</code>
        * [.usesAgent()](#WSv2+usesAgent) ⇒ <code>boolean</code>
        * [.updateAuthArgs(args)](#WSv2+updateAuthArgs)
        * [.getAuthArgs()](#WSv2+getAuthArgs) ⇒ <code>object</code>
        * [.setAPICredentials(apiKey, apiSecret)](#WSv2+setAPICredentials)
        * [.getDataChannelCount()](#WSv2+getDataChannelCount) ⇒ <code>number</code>
        * [.hasChannel(chanId)](#WSv2+hasChannel) ⇒ <code>boolean</code>
        * [.hasSubscriptionRef(channel, identifier)](#WSv2+hasSubscriptionRef) ⇒ <code>boolean</code>
        * [.getDataChannelId(type, filter)](#WSv2+getDataChannelId) ⇒ <code>number</code>
        * [.hasDataChannel(type, filter)](#WSv2+hasDataChannel) ⇒ <code>boolean</code>
        * [.open()](#WSv2+open) ⇒ <code>Promise</code>
        * [.close(code, reason)](#WSv2+close) ⇒ <code>Promise</code>
        * [.auth([calc], [dms])](#WSv2+auth) ⇒ <code>Promise</code>
        * [.reconnect()](#WSv2+reconnect) ⇒ <code>Promise</code>
        * [.getOB(symbol)](#WSv2+getOB) ⇒ <code>bfx-api-node-models.OrderBook</code>
        * [.getLosslessOB(symbol)](#WSv2+getLosslessOB) ⇒ <code>bfx-api-node-models.OrderBook</code>
        * [.getCandles(key)](#WSv2+getCandles) ⇒ <code>bfx-api-node-models.Candle</code> \| <code>Array.&lt;bfx-api-node-models.Candle~ArrayData&gt;</code>
        * [.managedSubscribe(channel, identifier, payload)](#WSv2+managedSubscribe) ⇒ <code>boolean</code>
        * [.managedUnsubscribe(channel, identifier)](#WSv2+managedUnsubscribe) ⇒ <code>boolean</code>
        * [.getChannelData(opts)](#WSv2+getChannelData) ⇒ <code>object</code>
        * [.send(msg)](#WSv2+send)
        * [.sequencingEnabled()](#WSv2+sequencingEnabled) ⇒ <code>boolean</code>
        * [.enableSequencing(args)](#WSv2+enableSequencing) ⇒ <code>Promise</code>
        * [.enableFlag(flag)](#WSv2+enableFlag) ⇒ <code>Promise</code>
        * [.isFlagEnabled(flag)](#WSv2+isFlagEnabled) ⇒ <code>boolean</code>
        * [.onServerRestart(cb)](#WSv2+onServerRestart)
        * [.onMaintenanceStart(cb)](#WSv2+onMaintenanceStart)
        * [.onMaintenanceEnd(cb)](#WSv2+onMaintenanceEnd)
        * [.subscribe(channel, payload)](#WSv2+subscribe)
        * [.subscribeTicker(symbol)](#WSv2+subscribeTicker) ⇒ <code>boolean</code>
        * [.subscribeTrades(symbol)](#WSv2+subscribeTrades) ⇒ <code>boolean</code>
        * [.subscribeOrderBook(symbol, prec, len)](#WSv2+subscribeOrderBook) ⇒ <code>boolean</code>
        * [.subscribeCandles(key)](#WSv2+subscribeCandles) ⇒ <code>boolean</code>
        * [.subscribeStatus(key)](#WSv2+subscribeStatus) ⇒ <code>boolean</code>
        * [.unsubscribe(chanId)](#WSv2+unsubscribe)
        * [.unsubscribeTicker(symbol)](#WSv2+unsubscribeTicker) ⇒ <code>boolean</code>
        * [.unsubscribeTrades(symbol)](#WSv2+unsubscribeTrades) ⇒ <code>boolean</code>
        * [.unsubscribeOrderBook(symbol)](#WSv2+unsubscribeOrderBook) ⇒ <code>boolean</code>
        * [.unsubscribeCandles(symbol, frame)](#WSv2+unsubscribeCandles) ⇒ <code>boolean</code>
        * [.unsubscribeStatus(key)](#WSv2+unsubscribeStatus) ⇒ <code>boolean</code>
        * [.removeListeners(cbGID)](#WSv2+removeListeners)
        * [.requestCalc(prefixes)](#WSv2+requestCalc)
        * [.submitOrder(order)](#WSv2+submitOrder) ⇒ <code>Promise</code>
        * [.updateOrder(changes)](#WSv2+updateOrder) ⇒ <code>Promise</code>
        * [.cancelOrder(order)](#WSv2+cancelOrder) ⇒ <code>Promise</code>
        * [.cancelOrders(orders)](#WSv2+cancelOrders) ⇒ <code>Promise</code>
        * [.submitOrderMultiOp(opPayloads)](#WSv2+submitOrderMultiOp) ⇒ <code>Promise</code>
        * [.isAuthenticated()](#WSv2+isAuthenticated) ⇒ <code>boolean</code>
        * [.isOpen()](#WSv2+isOpen) ⇒ <code>boolean</code>
        * [.isReconnecting()](#WSv2+isReconnecting) ⇒ <code>boolean</code>
        * [.notifyUI(opts)](#WSv2+notifyUI)
        * [.onInfoMessage(code, cb)](#WSv2+onInfoMessage)
        * [.onMessage(opts, cb)](#WSv2+onMessage)
        * [.onCandle(opts, cb)](#WSv2+onCandle)
        * [.onOrderBook(opts, cb)](#WSv2+onOrderBook)
        * [.onOrderBookChecksum(opts, cb)](#WSv2+onOrderBookChecksum)
        * [.onTrades(opts, cb)](#WSv2+onTrades)
        * [.onTradeEntry(opts, cb)](#WSv2+onTradeEntry)
        * [.onAccountTradeEntry(opts, cb)](#WSv2+onAccountTradeEntry)
        * [.onAccountTradeUpdate(opts, cb)](#WSv2+onAccountTradeUpdate)
        * [.onTicker(opts, cb)](#WSv2+onTicker)
        * [.onStatus(opts, cb)](#WSv2+onStatus)
        * [.onOrderSnapshot(opts, cb)](#WSv2+onOrderSnapshot)
        * [.onOrderNew(opts, cb)](#WSv2+onOrderNew)
        * [.onOrderUpdate(opts, cb)](#WSv2+onOrderUpdate)
        * [.onOrderClose(opts, cb)](#WSv2+onOrderClose)
        * [.onPositionSnapshot(opts, cb)](#WSv2+onPositionSnapshot)
        * [.onPositionNew(opts, cb)](#WSv2+onPositionNew)
        * [.onPositionUpdate(opts, cb)](#WSv2+onPositionUpdate)
        * [.onPositionClose(opts, cb)](#WSv2+onPositionClose)
        * [.onFundingOfferSnapshot(opts, cb)](#WSv2+onFundingOfferSnapshot)
        * [.onFundingOfferNew(opts, cb)](#WSv2+onFundingOfferNew)
        * [.onFundingOfferUpdate(opts, cb)](#WSv2+onFundingOfferUpdate)
        * [.onFundingOfferClose(opts, cb)](#WSv2+onFundingOfferClose)
        * [.onFundingCreditSnapshot(opts, cb)](#WSv2+onFundingCreditSnapshot)
        * [.onFundingCreditNew(opts, cb)](#WSv2+onFundingCreditNew)
        * [.onFundingCreditUpdate(opts, cb)](#WSv2+onFundingCreditUpdate)
        * [.onFundingCreditClose(opts, cb)](#WSv2+onFundingCreditClose)
        * [.onFundingLoanSnapshot(opts, cb)](#WSv2+onFundingLoanSnapshot)
        * [.onFundingLoanNew(opts, cb)](#WSv2+onFundingLoanNew)
        * [.onFundingLoanUpdate(opts, cb)](#WSv2+onFundingLoanUpdate)
        * [.onFundingLoanClose(opts, cb)](#WSv2+onFundingLoanClose)
        * [.onWalletSnapshot(opts, cb)](#WSv2+onWalletSnapshot)
        * [.onWalletUpdate(opts, cb)](#WSv2+onWalletUpdate)
        * [.onBalanceInfoUpdate(opts, cb)](#WSv2+onBalanceInfoUpdate)
        * [.onMarginInfoUpdate(opts, cb)](#WSv2+onMarginInfoUpdate)
        * [.onFundingInfoUpdate(opts, cb)](#WSv2+onFundingInfoUpdate)
        * [.onFundingTradeEntry(opts, cb)](#WSv2+onFundingTradeEntry)
        * [.onFundingTradeUpdate(opts, cb)](#WSv2+onFundingTradeUpdate)
        * [.onNotification(opts, cb)](#WSv2+onNotification)
    * _static_
        * [.url](#WSv2.url) : <code>string</code>
    * _inner_
        * [~Configuration](#WSv2..Configuration) : <code>object</code>

<a name="new_WSv2_new"></a>

### new WSv2([config])
Instantiate a new ws2 transport. Does not auto-open


| Param | Type | Description |
| --- | --- | --- |
| [config] | [<code>Configuration</code>](#WSv2..Configuration) | client   configuration |

**Example**  
```js
const ws = new WSv2()

ws.on('open', async () => {
  ws.onTrades({ symbol: 'tBTCUSD' }, (trades) => {
    console.log('recv trades: %j', trades)
  })

  await ws.subscribeTrades('tBTCUSD')
})

await ws.open()
```
<a name="WSv2+WSv2.flags"></a>

### wSv2.WSv2.flags
Map of flag names and numeric values for usage with the API

**Kind**: instance constant of [<code>WSv2</code>](#WSv2)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| DEC_S | <code>number</code> | flag to request all decimals as strings |
| TIME_S | <code>number</code> | flag to request all timestamps as strings |
| TIMESTAMP | <code>number</code> | flag to request timestamp in milliseconds |
| SEQ_ALL | <code>number</code> | flag to enable sequence numbers & verification |
| CHECKSUM | <code>number</code> | flag to enable order book checksums |

<a name="WSv2+WSv2.info"></a>

### wSv2.WSv2.info
Map of info event names and their respective codes for usage with the API

**Kind**: instance constant of [<code>WSv2</code>](#WSv2)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| SERVER_RESTART | <code>number</code> | server restart event |
| MAINTENANCE_START | <code>number</code> | maintenance start event |
| MAINTENANCE_END | <code>number</code> | maintenance end event |

<a name="WSv2+getURL"></a>

### wSv2.getURL() ⇒ <code>string</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>string</code> - url  
<a name="WSv2+usesAgent"></a>

### wSv2.usesAgent() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - usesAgent  
<a name="WSv2+updateAuthArgs"></a>

### wSv2.updateAuthArgs(args)
Set `calc` and `dms` values to be used on the next
[auth](#WSv2+auth) call

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: [auth](#WSv2+auth)  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | arguments |
| [args.calc] | <code>number</code> | calc value |
| [args.dms] | <code>number</code> | dms value, active 4 |

<a name="WSv2+getAuthArgs"></a>

### wSv2.getAuthArgs() ⇒ <code>object</code>
Fetch the current default auth parameters

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>object</code> - authArgs  
**See**

- [updateAuthArgs](#WSv2+updateAuthArgs)
- [auth](#WSv2+auth)

<a name="WSv2+setAPICredentials"></a>

### wSv2.setAPICredentials(apiKey, apiSecret)
Update the internal API credentials, used on subsequent
[auth](#WSv2+auth) calls

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: [auth](#WSv2+auth)  

| Param | Type | Description |
| --- | --- | --- |
| apiKey | <code>string</code> | API key |
| apiSecret | <code>string</code> | API secret |

<a name="WSv2+getDataChannelCount"></a>

### wSv2.getDataChannelCount() ⇒ <code>number</code>
Get the total number of data channels this instance is currently
subscribed too.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>number</code> - count  
**See**

- [subscribeTrades](#WSv2+subscribeTrades)
- [subscribeTicker](#WSv2+subscribeTicker)
- [subscribeCandles](#WSv2+subscribeCandles)
- [subscribeOrderBook](#WSv2+subscribeOrderBook)

<a name="WSv2+hasChannel"></a>

### wSv2.hasChannel(chanId) ⇒ <code>boolean</code>
Check if the instance is subscribed to the specified channel ID

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - isSubscribed  

| Param | Type | Description |
| --- | --- | --- |
| chanId | <code>number</code> | ID of channel to query |

<a name="WSv2+hasSubscriptionRef"></a>

### wSv2.hasSubscriptionRef(channel, identifier) ⇒ <code>boolean</code>
Check if a channel/identifier pair has been subscribed too

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - hasRef  
**See**: [managedSubscribe](#WSv2+managedSubscribe)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel type |
| identifier | <code>string</code> | unique identifier for the reference |

<a name="WSv2+getDataChannelId"></a>

### wSv2.getDataChannelId(type, filter) ⇒ <code>number</code>
Fetch the ID of a channel matched by type and channel data filter

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>number</code> - channelID  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | channel type |
| filter | <code>object</code> | to be matched against channel data |

<a name="WSv2+hasDataChannel"></a>

### wSv2.hasDataChannel(type, filter) ⇒ <code>boolean</code>
Check if the instance is subscribed to a data channel matching the
specified type and filter.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - hasChannel  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | channel type |
| filter | <code>object</code> | to be matched against channel data |

<a name="WSv2+open"></a>

### wSv2.open() ⇒ <code>Promise</code>
Opens a connection to the API server. Rejects with an error if a
connection is already open. Resolves on success.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  
<a name="WSv2+close"></a>

### wSv2.close(code, reason) ⇒ <code>Promise</code>
Closes the active connection. If there is none, rejects with a promise.
Resolves on success

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | passed to ws |
| reason | <code>string</code> | passed to ws |

<a name="WSv2+auth"></a>

### wSv2.auth([calc], [dms]) ⇒ <code>Promise</code>
Generates & sends an authentication packet to the server; if already
authenticated, rejects with an error, resolves on success.

If a DMS flag of 4 is provided, all open orders are cancelled when the
connection terminates.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| [calc] | <code>number</code> | default is 0 |
| [dms] | <code>number</code> | dead man switch flag, active 4 |

<a name="WSv2+reconnect"></a>

### wSv2.reconnect() ⇒ <code>Promise</code>
Utility method to close & re-open the ws connection. Re-authenticates if
previously authenticated

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p - resolves on completion  
<a name="WSv2+getOB"></a>

### wSv2.getOB(symbol) ⇒ <code>bfx-api-node-models.OrderBook</code>
Returns an up-to-date copy of the order book for the specified symbol, or
null if no OB is managed for that symbol.

Set `managedOrderBooks: true` in the constructor to use.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>bfx-api-node-models.OrderBook</code> - ob - null if not found  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol for order book |

**Example**  
```js
const ws = new WSv2({ managedOrderBooks: true })

ws.on('open', async () => {
  ws.onOrderBook({ symbol: 'tBTCUSD' }, () => {
    const book = ws.getOB('tBTCUSD')

    if (!book) return

    const spread = book.midPrice()
    console.log('spread for tBTCUSD: %f', spread)
  })

  ws.subscribeOrderBook({ symbol: 'tBTCUSD' })
})

await ws.open()
```
<a name="WSv2+getLosslessOB"></a>

### wSv2.getLosslessOB(symbol) ⇒ <code>bfx-api-node-models.OrderBook</code>
Returns an up-to-date lossless copy of the order book for the specified symbol, or
null if no OB is managed for that symbol. All amounts and prices are in original
string format.

Set `manageOrderBooks: true` in the constructor to use.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>bfx-api-node-models.OrderBook</code> - ob - null if not found  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol for order book |

<a name="WSv2+getCandles"></a>

### wSv2.getCandles(key) ⇒ <code>bfx-api-node-models.Candle</code> \| <code>Array.&lt;bfx-api-node-models.Candle~ArrayData&gt;</code>
Fetch a reference to the full set of synced candles for the specified key.
Set `managedCandles: true` in the constructor to use.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>bfx-api-node-models.Candle</code> \| <code>Array.&lt;bfx-api-node-models.Candle~ArrayData&gt;</code> - candles - empty array if none exist  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key for candle set |

**Example**  
```js
const ws = new WSv2({ managedCandles: true })

ws.on('open', async () => {
  ws.onCandles({ key: 'trade:1m:tBTCUSD' }, () => {
    const candles = ws.getCandles('trade:1m:tBTCUSD')

    if (!candles) return

    console.log('%d candles in dataset', candles.length)
  })

  ws.subscribeCandles({ key: 'trade:1m:tBTCUSD' })
})

await ws.open()
```
<a name="WSv2+managedSubscribe"></a>

### wSv2.managedSubscribe(channel, identifier, payload) ⇒ <code>boolean</code>
Subscribes and tracks subscriptions per channel/identifier pair. If
already subscribed to the specified pair, nothing happens.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - subSent  
**See**

- [subscribeTrades](#WSv2+subscribeTrades)
- [subscribeTicker](#WSv2+subscribeTicker)
- [subscribeCandles](#WSv2+subscribeCandles)
- [subscribeOrderBook](#WSv2+subscribeOrderBook)

**Todo**

- [ ] will be refactored to return promise from subscribe() call instead
  of sub action taken flag


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel name |
| identifier | <code>string</code> | for uniquely identifying the ref count |
| payload | <code>object</code> | merged with sub packet |

**Example**  
```js
const ws = new WSv2()

ws.on('open', async () => {
  ws.onTrades({ symbol: 'tBTCUSD' }, (trades) => {
    console.log('recv trades: %j', trades)
 })

  ws.managedSubscribe('trades', 'tBTCUSD', { symbol: 'tBTCUSD' })
})

await ws.open()
```
<a name="WSv2+managedUnsubscribe"></a>

### wSv2.managedUnsubscribe(channel, identifier) ⇒ <code>boolean</code>
Decreases the subscription ref count for the channel/identifier pair, and
unsubscribes from the channel if it reaches 0.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - unsubSent  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel name |
| identifier | <code>string</code> | for uniquely identifying the ref count |

<a name="WSv2+getChannelData"></a>

### wSv2.getChannelData(opts) ⇒ <code>object</code>
Fetch a channel definition

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>object</code> - chanData - null if not found  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.chanId | <code>number</code> | channel ID |
| opts.channel | <code>string</code> | channel name |
| [opts.symbol] | <code>string</code> | match by symbol |
| [opts.key] | <code>string</code> | match by key (for candle channels) |

<a name="WSv2+send"></a>

### wSv2.send(msg)
Send a packet to the WS server

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>Array</code> \| <code>object</code> | packet, gets stringified |

<a name="WSv2+sequencingEnabled"></a>

### wSv2.sequencingEnabled() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - sequencingEnabled  
<a name="WSv2+enableSequencing"></a>

### wSv2.enableSequencing(args) ⇒ <code>Promise</code>
Configures the seq flag to enable sequencing (packet number) for this
connection. When enabled, the seq number will be the last value of
channel packet arrays.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  
**See**: [WSv2#flags](WSv2#flags)  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | params |
| [args.audit] | <code>boolean</code> | if true, an error is emitted on invalid seq |

<a name="WSv2+enableFlag"></a>

### wSv2.enableFlag(flag) ⇒ <code>Promise</code>
Enables a configuration flag.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  
**See**: [WSv2#flags](WSv2#flags)  

| Param | Type | Description |
| --- | --- | --- |
| flag | <code>number</code> | flag to update, as numeric value |

**Example**  
```js
const ws = new WSv2()

ws.on('open', async () => {
  await ws.enableFlag(WSv2.flags.CHECKSUM)
  console.log('ob checkums enabled')
})

await ws.open()
```
<a name="WSv2+isFlagEnabled"></a>

### wSv2.isFlagEnabled(flag) ⇒ <code>boolean</code>
Checks local state, relies on successful server config responses

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - enabled  
**See**: [enableFlag](#WSv2+enableFlag)  

| Param | Type | Description |
| --- | --- | --- |
| flag | <code>number</code> | flag to check for |

<a name="WSv2+onServerRestart"></a>

### wSv2.onServerRestart(cb)
Register a callback in case of a ws server restart message; Use this to
call reconnect() if needed. (code 20051)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | called on event trigger |

<a name="WSv2+onMaintenanceStart"></a>

### wSv2.onMaintenanceStart(cb)
Register a callback in case of a 'maintenance started' message from the
server. This is a good time to pause server packets until maintenance ends

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | called on event trigger |

<a name="WSv2+onMaintenanceEnd"></a>

### wSv2.onMaintenanceEnd(cb)
Register a callback to be notified of a maintenance period ending

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | called on event trigger |

<a name="WSv2+subscribe"></a>

### wSv2.subscribe(channel, payload)
Subscribe to a channel with the given filter payload

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel payload/data |
| payload | <code>object</code> | optional extra packet data |

**Example**  
```js
const ws = new WSv2()

ws.on('open', () => {
  ws.onTrades({ symbol: 'tBTCUSD' }, (trades) => {
    // ...
  })

  ws.subscribe('trades', { symbol: 'tBTCUSD' })
})

await ws.open()
```
<a name="WSv2+subscribeTicker"></a>

### wSv2.subscribeTicker(symbol) ⇒ <code>boolean</code>
Subscribe to a ticker data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - subscribed  
**See**: [managedSubscribe](#WSv2+managedSubscribe)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol of ticker |

**Example**  
```js
await ws.subscribeTicker('tBTCUSD')
```
<a name="WSv2+subscribeTrades"></a>

### wSv2.subscribeTrades(symbol) ⇒ <code>boolean</code>
Subscribe to a trades data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - subscribed  
**See**: [managedSubscribe](#WSv2+managedSubscribe)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol of market to monitor |

**Example**  
```js
await ws.subscribeTrades('tBTCUSD')
```
<a name="WSv2+subscribeOrderBook"></a>

### wSv2.subscribeOrderBook(symbol, prec, len) ⇒ <code>boolean</code>
Subscribe to an order book data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - subscribed  
**See**: [managedSubscribe](#WSv2+managedSubscribe)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | symbol of order book |
| prec | <code>string</code> | <code>&quot;P0&quot;</code> | P0, P1, P2, or P3 (default P0) |
| len | <code>string</code> | <code>&quot;25&quot;</code> | 25 or 100 (default 25) |

**Example**  
```js
await ws.subscribeOrderBook('tBTCUSD', 'R0', '25')
```
<a name="WSv2+subscribeCandles"></a>

### wSv2.subscribeCandles(key) ⇒ <code>boolean</code>
Subscribe to a candle data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - subscribed  
**See**: [managedSubscribe](#WSv2+managedSubscribe)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 'trade:5m:tBTCUSD' |

**Example**  
```js
await ws.subscribeCandles('trade:5m:tBTCUSD')
```
<a name="WSv2+subscribeStatus"></a>

### wSv2.subscribeStatus(key) ⇒ <code>boolean</code>
Subscribe to a status data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - subscribed  
**See**: [managedSubscribe](#WSv2+managedSubscribe)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | i.e. 'liq:global' |

**Example**  
```js
await ws.subscribeStatus('liq:global')
```
<a name="WSv2+unsubscribe"></a>

### wSv2.unsubscribe(chanId)
Unsubscribe from a channel by ID

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| chanId | <code>number</code> | ID of channel to unsubscribe from |

**Example**  
```js
const id = ws.getDataChannelId('ticker', { symbol: 'tBTCUSD' })

if (id) {
  ws.unsubscribe(id)
}
```
<a name="WSv2+unsubscribeTicker"></a>

### wSv2.unsubscribeTicker(symbol) ⇒ <code>boolean</code>
Unsubscribe from a ticker data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - unsubscribed  
**See**: [subscribeTicker](#WSv2+subscribeTicker)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol of ticker |

**Example**  
```js
await ws.unsubscribeTicker('tBTCUSD')
```
<a name="WSv2+unsubscribeTrades"></a>

### wSv2.unsubscribeTrades(symbol) ⇒ <code>boolean</code>
Unsubscribe from a trades data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - unsubscribed  
**See**: [subscribeTrades](#WSv2+subscribeTrades)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol of market to unsubscribe from |

**Example**  
```js
await ws.unsubcribeTrades('tBTCUSD')
```
<a name="WSv2+unsubscribeOrderBook"></a>

### wSv2.unsubscribeOrderBook(symbol) ⇒ <code>boolean</code>
Unsubscribe from an order book data channel

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - unsubscribed  
**See**: [subscribeOrderBook](#WSv2+subscribeOrderBook)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol of order book |

**Example**  
```js
await ws.unsubcribeOrderBook('tBTCUSD')
```
<a name="WSv2+unsubscribeCandles"></a>

### wSv2.unsubscribeCandles(symbol, frame) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - unsubscribed  
**See**: [subscribeCandles](#WSv2+subscribeCandles)  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | symbol of candles |
| frame | <code>string</code> | time frame |

**Example**  
```js
await ws.unsubscribeCandles('tBTCUSD', '1m')
```
<a name="WSv2+unsubscribeStatus"></a>

### wSv2.unsubscribeStatus(key) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - unsubscribed  
**See**: [subscribeStatus](#WSv2+subscribeStatus)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key that was used in initial [subscribeStatus](#WSv2+subscribeStatus) call |

<a name="WSv2+removeListeners"></a>

### wSv2.removeListeners(cbGID)
Remove all listeners by callback group ID

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| cbGID | <code>string</code> | callback group to remove |

**Example**  
```js
await ws.subscribeTrades({ symbol: 'tBTCUSD', cbGID: 42 })
await ws.subscribeTrades({ symbol: 'tLEOUSD', cbGID: 42 })
await ws.subscribeTrades({ symbol: 'tETHUSD', cbGID: 42 })

// ...

ws.removeListeners(42)
```
<a name="WSv2+requestCalc"></a>

### wSv2.requestCalc(prefixes)
Request a calc operation to be performed on the specified indexes

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| prefixes | <code>Array.&lt;string&gt;</code> | desired prefixes to be calculated |

<a name="WSv2+submitOrder"></a>

### wSv2.submitOrder(order) ⇒ <code>Promise</code>
Sends a new order to the server and resolves the returned promise once the
order submit is confirmed. Emits an error if not authenticated. The order
can be either an array, key/value map, or Order object instance.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p - resolves on submit notification  
**See**

- [cancelOrders](#WSv2+cancelOrders)
- [cancelOrder](#WSv2+cancelOrder)
- [updateOrder](#WSv2+updateOrder)


| Param | Type | Description |
| --- | --- | --- |
| order | <code>bfx-api-node-models.Order</code> \| <code>bfx-api-node-models.Order~Data</code> | order |

**Example**  
```js
const o = new Order({
  type: Order.type.EXCHANGE_LIMIT,
  amount: 18,
  price: 0.75,
  symbol: 'tBTCUSD',
  hidden: true
}, ws)

await ws.submitOrder(o)

console.log('order confirmed! status: %s', o.status)
```
<a name="WSv2+updateOrder"></a>

### wSv2.updateOrder(changes) ⇒ <code>Promise</code>
Send a changeset to update an order in-place while maintaining position in
the price queue. The changeset must contain the order ID, and supports a
'delta' key to increase/decrease the total amount.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p - resolves on receiving an confirmation notification  
**See**: [submitOrder](#WSv2+submitOrder)  

| Param | Type | Description |
| --- | --- | --- |
| changes | <code>object</code> | requires at least an 'id' |

<a name="WSv2+cancelOrder"></a>

### wSv2.cancelOrder(order) ⇒ <code>Promise</code>
Cancels an order by ID and resolves the returned promise once the cancel is
confirmed. Emits an error if not authenticated. The ID can be passed as a
number, or taken from an order array/object.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  
**See**: [submitOrder](#WSv2+submitOrder)  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>bfx-api-node-models.Order</code> \| <code>bfx-api-node-models.Order~Data</code> \| <code>number</code> | order model, array, or ID to be cancelled |

<a name="WSv2+cancelOrders"></a>

### wSv2.cancelOrders(orders) ⇒ <code>Promise</code>
Cancels multiple orders, returns a promise that resolves once all
operations are confirmed.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p  
**See**: [submitOrder](#WSv2+submitOrder)  

| Param | Type | Description |
| --- | --- | --- |
| orders | <code>Array.&lt;bfx-api-node-models.Order&gt;</code> \| <code>Array.&lt;bfx-api-node-models.Order~Data&gt;</code> \| <code>Array.&lt;number&gt;</code> | array of order models, arrays or IDs to be cancelled |

<a name="WSv2+submitOrderMultiOp"></a>

### wSv2.submitOrderMultiOp(opPayloads) ⇒ <code>Promise</code>
Sends the op payloads to the server as an 'ox_multi' command. A promise is
returned and resolves immediately if authenticated, as no confirmation is
available for this message type.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>Promise</code> - p - rejects if not authenticated  

| Param | Type | Description |
| --- | --- | --- |
| opPayloads | <code>Array.&lt;object&gt;</code> | order operations |

<a name="WSv2+isAuthenticated"></a>

### wSv2.isAuthenticated() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - authenticated  
<a name="WSv2+isOpen"></a>

### wSv2.isOpen() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - open  
<a name="WSv2+isReconnecting"></a>

### wSv2.isReconnecting() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Returns**: <code>boolean</code> - reconnecting  
<a name="WSv2+notifyUI"></a>

### wSv2.notifyUI(opts)
Sends a broadcast notification, which will be received by any active UI
websocket connections (at bitfinex.com), triggering a desktop notification.

In the future our mobile app will also support spawning native push
notifications in response to incoming ucm-notify-ui packets.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**Throws**:

- an error if given no type or message, or the instance is not open
  and authenticated


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>bfx-api-node-models.Notification~BroadcastPayload</code> | broadcast payload |

<a name="WSv2+onInfoMessage"></a>

### wSv2.onInfoMessage(code, cb)
Registers a new callback to be called when a matching info message is
received.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | from [WSv2.info](WSv2.info) |
| cb | <code>function</code> | callback |

<a name="WSv2+onMessage"></a>

### wSv2.onMessage(opts, cb)
Register a generic handler to be called with each received message

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onCandle"></a>

### wSv2.onCandle(opts, cb)
Register a handler to be called with each received candle

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-public-candle
- [subscribeCandles](#WSv2+subscribeCandles)
- [unsubscribeCandles](#WSv2+unsubscribeCandles)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.key | <code>string</code> | candle set key, i.e. trade:30m:tBTCUSD |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onOrderBook"></a>

### wSv2.onOrderBook(opts, cb)
Register a handler to be called with each received candle

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-public-order-books
- [subscribeOrderBook](#WSv2+subscribeOrderBook)
- [unsubscribeOrderBook](#WSv2+unsubscribeOrderBook)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.symbol | <code>string</code> | book symbol |
| opts.prec | <code>string</code> | book precision, i.e. 'R0' |
| opts.len | <code>string</code> | book length, i.e. '25' |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onOrderBookChecksum"></a>

### wSv2.onOrderBookChecksum(opts, cb)
Register a handler to be called with each received order book checksum

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-public-order-books
- [subscribeOrderBook](#WSv2+subscribeOrderBook)
- [unsubscribeOrderBook](#WSv2+unsubscribeOrderBook)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.symbol | <code>string</code> | book symbol |
| opts.prec | <code>string</code> | book precision, i.e. 'R0' |
| opts.len | <code>string</code> | book length, i.e. '25' |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onTrades"></a>

### wSv2.onTrades(opts, cb)
Register a handler to be called with each received trade (pair or symbol
required)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-public-trades
- [subscribeTrades](#WSv2+subscribeTrades)
- [unsubscribeTrades](#WSv2+unsubscribeTrades)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.pair] | <code>string</code> | required if no symbol specified |
| [opts.symbol] | <code>string</code> | required if no pair specified |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onTradeEntry"></a>

### wSv2.onTradeEntry(opts, cb)
Register a handler to be called on each trade `'te'` event

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-public-trades
- [subscribeTrades](#WSv2+subscribeTrades)
- [unsubscribeTrades](#WSv2+unsubscribeTrades)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.pair] | <code>string</code> | required if no symbol specified |
| [opts.symbol] | <code>string</code> | required if no pair specified |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onAccountTradeEntry"></a>

### wSv2.onAccountTradeEntry(opts, cb)
Register a handler to be called on each personal trade `'te'` event

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | required if no pair specified |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onAccountTradeUpdate"></a>

### wSv2.onAccountTradeUpdate(opts, cb)
Register a handler to be called on each personal trade `'tu'` event

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | required if no pair specified |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onTicker"></a>

### wSv2.onTicker(opts, cb)
Register a handler to be called on each received ticker

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-public-ticker
- [subscribeTicker](#WSv2+subscribeTicker)
- [unsubscribeTicker](#WSv2+unsubscribeTicker)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.symbol | <code>string</code> | symbol for tickers |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onStatus"></a>

### wSv2.onStatus(opts, cb)
Register a handler to be called on each message for the desired status
feed.

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: [subscribeStatus](#WSv2+subscribeStatus)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| opts.key | <code>string</code> | key of feed to listen on |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group ID |
| cb | <code>function</code> | callback |

<a name="WSv2+onOrderSnapshot"></a>

### wSv2.onOrderSnapshot(opts, cb)
Register a handler to be called on each full order snapshot (sent on auth)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-orders
- [auth](#WSv2+auth)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.id] | <code>number</code> | order ID to match |
| [opts.cid] | <code>number</code> | order client ID to match |
| [opts.gid] | <code>number</code> | order group ID to match |
| [opts.cbGID] | <code>string</code> \| <code>number</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onOrderNew"></a>

### wSv2.onOrderNew(opts, cb)
Register a handler to be called on each new order packet

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-orders
- [submitOrder](#WSv2+submitOrder)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.id] | <code>number</code> | order ID to match |
| [opts.cid] | <code>number</code> | order client ID to match |
| [opts.gid] | <code>number</code> | order group ID to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onOrderUpdate"></a>

### wSv2.onOrderUpdate(opts, cb)
Register a handler to be called on each order update packet

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-orders
- [updateOrder](#WSv2+updateOrder)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.id] | <code>number</code> | order ID to match |
| [opts.cid] | <code>number</code> | order client ID to match |
| [opts.gid] | <code>number</code> | order group ID to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onOrderClose"></a>

### wSv2.onOrderClose(opts, cb)
Register a handler to be called on each order close packet

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-orders
- [cancelOrder](#WSv2+cancelOrder)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.id] | <code>number</code> | order ID to match |
| [opts.cid] | <code>number</code> | order client ID to match |
| [opts.gid] | <code>number</code> | order group ID to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onPositionSnapshot"></a>

### wSv2.onPositionSnapshot(opts, cb)
Register a handler to be called on each position snapshot (sent on auth)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-position
- [auth](#WSv2+auth)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onPositionNew"></a>

### wSv2.onPositionNew(opts, cb)
Register a handler to be called when a position is opened

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onPositionUpdate"></a>

### wSv2.onPositionUpdate(opts, cb)
Register a handler to be called when a position is updated

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onPositionClose"></a>

### wSv2.onPositionClose(opts, cb)
Register a handler to be called when a position is closed

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingOfferSnapshot"></a>

### wSv2.onFundingOfferSnapshot(opts, cb)
Register a handler to be called on each fundign offer snapshot (sent on
auth)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-offers
- [auth](#WSv2+auth)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingOfferNew"></a>

### wSv2.onFundingOfferNew(opts, cb)
Register a handler to be called when a funding offer is created

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingOfferUpdate"></a>

### wSv2.onFundingOfferUpdate(opts, cb)
Register a handler to be called when a funding offer is updated

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingOfferClose"></a>

### wSv2.onFundingOfferClose(opts, cb)
Register a handler to be called when a funding offer is closed

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingCreditSnapshot"></a>

### wSv2.onFundingCreditSnapshot(opts, cb)
Register a handler to be called on each funding credit snapshot (sent on
auth)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-credits
- [auth](#WSv2+auth)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingCreditNew"></a>

### wSv2.onFundingCreditNew(opts, cb)
Register a handler to be called when a funding credit is created

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingCreditUpdate"></a>

### wSv2.onFundingCreditUpdate(opts, cb)
Register a handler to be called when a funding credit is updated

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingCreditClose"></a>

### wSv2.onFundingCreditClose(opts, cb)
Register a handler to be called when a funding credit is closed

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingLoanSnapshot"></a>

### wSv2.onFundingLoanSnapshot(opts, cb)
Register a handler to be called on each funding loan snapshot (sent on
auth)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**

- https://docs.bitfinex.com/v2/reference#ws-auth-loans
- [auth](#WSv2+auth)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingLoanNew"></a>

### wSv2.onFundingLoanNew(opts, cb)
Register a handler to be called when a funding loan is created

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingLoanUpdate"></a>

### wSv2.onFundingLoanUpdate(opts, cb)
Register a handler to be called when a funding loan is updated

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingLoanClose"></a>

### wSv2.onFundingLoanClose(opts, cb)
Register a handler to be called when a funding loan is closed

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onWalletSnapshot"></a>

### wSv2.onWalletSnapshot(opts, cb)
Register a handler to be called on each wallet snapshot (sent on auth)

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-wallets  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onWalletUpdate"></a>

### wSv2.onWalletUpdate(opts, cb)
Register a handler to be called on each wallet update

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-wallets  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onBalanceInfoUpdate"></a>

### wSv2.onBalanceInfoUpdate(opts, cb)
Register a handler to be called on each balance info update

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-balance  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onMarginInfoUpdate"></a>

### wSv2.onMarginInfoUpdate(opts, cb)
Register a handler to be called on each margin info update

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-margin  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingInfoUpdate"></a>

### wSv2.onFundingInfoUpdate(opts, cb)
Register a handler to be called on each funding info update

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-funding  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingTradeEntry"></a>

### wSv2.onFundingTradeEntry(opts, cb)
Register a handler to be called on each funding trade `'te'` event

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onFundingTradeUpdate"></a>

### wSv2.onFundingTradeUpdate(opts, cb)
Register a handler to be called on each funding trade `'tu'` event

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.symbol] | <code>string</code> | symbol to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2+onNotification"></a>

### wSv2.onNotification(opts, cb)
Register a handler to be called on each notification

**Kind**: instance method of [<code>WSv2</code>](#WSv2)  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-notifications  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options |
| [opts.type] | <code>string</code> | type to match |
| [opts.cbGID] | <code>string</code> | callback group id |
| cb | <code>function</code> | callback |

<a name="WSv2.url"></a>

### WSv2.url : <code>string</code>
Default connection URL

**Kind**: static constant of [<code>WSv2</code>](#WSv2)  
**Default**: <code>&quot;wss://api.bitfinex.com/ws/2&quot;</code>  
<a name="WSv2..Configuration"></a>

### WSv2~Configuration : <code>object</code>
Configuration options for a WSv2 client instance.

**Kind**: inner typedef of [<code>WSv2</code>](#WSv2)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [affCode] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | affiliate code to be applied to all orders |
| [apiKey] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | API key |
| [apiSecret] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | API secret |
| [url] | <code>string</code> | <code>&quot;&#x27;wss://api.bitfinex.com/ws/2&#x27;&quot;</code> | ws connection url |
| [orderOpBufferDelay] | <code>number</code> |  | multi-order op batching timeout |
| [transform] | <code>boolean</code> |  | if true, packets are converted to models |
| [agent] | <code>object</code> |  | node agent for ws connection (proxy) |
| [manageOrderBooks] | <code>boolean</code> |  | enable local OB persistence |
| [manageCandles] | <code>boolean</code> |  | enable local candle persistence |
| [seqAudit] | <code>boolean</code> |  | enable sequence numbers & verification |
| [autoReconnect] | <code>boolean</code> |  | if true, we will reconnect on close |
| [reconnectDelay] | <code>number</code> |  | optional, defaults to 1000 (ms) |
| [reconnectThrottler] | <code>object</code> |  | pt to limit reconnect freq |
| [packetWDDelay] | <code>number</code> |  | watch-dog forced reconnection delay |

<a name="CandleChannel"></a>

## CandleChannel : <code>object</code>
An object describing a trade data channel on a [WSv2](#WSv2) data stream.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | 'candles' |
| chanId | <code>number</code> | channel ID |
| key | <code>string</code> | data key, 'trade:TF:SYMBOL' i.e. 'trade:1m:tBTCUSD' |

<a name="OrderBookChannel"></a>

## OrderBookChannel : <code>object</code>
An object describing an order book data channel on a WSv2 data stream.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | 'book' |
| chanId | <code>number</code> | channel ID |
| symbol | <code>string</code> | symbol |
| freq | <code>string</code> | frequency of updates; 'F0' is realtime, 'F1' is   once per 2 seconds |
| prec | <code>string</code> | precision, (aggregate 'P0', 'P1', 'P2', 'P3',   'P4', raw 'R0') |
| len | <code>string</code> | book depth, '25' (default) or '100' |

<a name="TickerChannel"></a>

## TickerChannel : <code>object</code>
An object describing a ticker data channel on a WSv2 data stream.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | 'ticker' |
| chanId | <code>number</code> | channel ID |
| symbol | <code>string</code> | symbol |

<a name="TradeChannel"></a>

## TradeChannel : <code>object</code>
An object describing a trade data channel on a WSv2 data stream.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | 'trades' |
| chanId | <code>number</code> | channel ID |
| symbol | <code>string</code> | symbol |

