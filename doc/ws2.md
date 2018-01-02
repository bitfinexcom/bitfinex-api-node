<a name="WSv2"></a>

## WSv2
Communicates with v2 of the Bitfinex WebSocket API

**Kind**: global class  

* [WSv2](#WSv2)
    * [new WSv2()](#new_WSv2_new)
    * [.open()](#WSv2+open) ⇒ <code>Promise</code>
    * [.close(code, reason)](#WSv2+close) ⇒ <code>Promise</code>
    * [.auth(calc)](#WSv2+auth) ⇒ <code>Promise</code>
    * [.reconnect()](#WSv2+reconnect) ⇒ <code>Promise</code>
    * [.getOB(symbol)](#WSv2+getOB) ⇒ <code>OrderBook</code>
    * [.getCandles(key)](#WSv2+getCandles) ⇒ <code>Array</code>
    * [.managedSubscribe(channel, identifier, payload)](#WSv2+managedSubscribe) ⇒ <code>boolean</code>
    * [.managedUnsubscribe(channel, identifier)](#WSv2+managedUnsubscribe) ⇒ <code>boolean</code>
    * [.getChannelData(opts)](#WSv2+getChannelData) ⇒ <code>Object</code>
    * [.send(msg)](#WSv2+send)
    * [.enableSequencing(args)](#WSv2+enableSequencing)
    * [.onServerRestart(cb)](#WSv2+onServerRestart)
    * [.onMaintenanceStart(cb)](#WSv2+onMaintenanceStart)
    * [.onMaintenanceEnd(cb)](#WSv2+onMaintenanceEnd)
    * [.subscribe(channel, payload)](#WSv2+subscribe)
    * [.subscribeTicker(symbol)](#WSv2+subscribeTicker) ⇒ <code>boolean</code>
    * [.subscribeTrades(symbol)](#WSv2+subscribeTrades) ⇒ <code>boolean</code>
    * [.subscribeOrderBook(symbol, prec, len)](#WSv2+subscribeOrderBook) ⇒ <code>boolean</code>
    * [.subscribeCandles(key)](#WSv2+subscribeCandles) ⇒ <code>boolean</code>
    * [.unsubscribe(chanId)](#WSv2+unsubscribe)
    * [.unsubscribeTicker(symbol)](#WSv2+unsubscribeTicker) ⇒ <code>boolean</code>
    * [.unsubscribeTrades(symbol)](#WSv2+unsubscribeTrades) ⇒ <code>boolean</code>
    * [.unsubscribeOrderBook(symbol, prec, len)](#WSv2+unsubscribeOrderBook) ⇒ <code>boolean</code>
    * [.unsubscribeCandles(symbol, frame)](#WSv2+unsubscribeCandles) ⇒ <code>boolean</code>
    * [.removeListeners(cbGID)](#WSv2+removeListeners)
    * [.requestCalc(prefixes)](#WSv2+requestCalc)
    * [.submitOrder(order)](#WSv2+submitOrder) ⇒ <code>Promise</code>
    * [.cancelOrder(order)](#WSv2+cancelOrder) ⇒ <code>Promise</code>
    * [.cancelOrders(orders)](#WSv2+cancelOrders) ⇒ <code>Promise</code>
    * [.submitOrderMultiOp(opPayloads)](#WSv2+submitOrderMultiOp) ⇒ <code>Promise</code>
    * [.isAuthenticated()](#WSv2+isAuthenticated) ⇒ <code>boolean</code>
    * [.isOpen()](#WSv2+isOpen) ⇒ <code>boolean</code>
    * [.onInfoMessage(code, cb)](#WSv2+onInfoMessage)
    * [.onMessage(opts, cb)](#WSv2+onMessage)
    * [.onCandle(opts, cb)](#WSv2+onCandle)
    * [.onOrderBook(opts, cb)](#WSv2+onOrderBook)
    * [.onTrades(opts, cb)](#WSv2+onTrades)
    * [.onTicker(opts, cb)](#WSv2+onTicker)
    * [.onOrderSnapshot(opts, cb)](#WSv2+onOrderSnapshot)
    * [.onOrderNew(opts, cb)](#WSv2+onOrderNew)
    * [.onOrderUpdate(opts, cb)](#WSv2+onOrderUpdate)
    * [.onOrderClose(opts, cb)](#WSv2+onOrderClose)
    * [.onPositionSnapshot(opts, cb)](#WSv2+onPositionSnapshot)
    * [.onPositionNew(opts, cb)](#WSv2+onPositionNew)
    * [.onPositionUpdate(opts, cb)](#WSv2+onPositionUpdate)
    * [.onPositionClose(opts, cb)](#WSv2+onPositionClose)
    * [.onTradeEntry(opts, cb)](#WSv2+onTradeEntry)
    * [.onTradeUpdate(opts, cb)](#WSv2+onTradeUpdate)
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

<a name="new_WSv2_new"></a>

### new WSv2()
Instantiate a new ws2 transport. Does not auto-open


| Param | Type | Description |
| --- | --- | --- |
| opts.apiKey | <code>string</code> |  |
| opts.apiSecret | <code>string</code> |  |
| opts.url | <code>string</code> | ws connection url |
| opts.orderOpBufferDelay | <code>number</code> | multi-order op batching timeout |
| opts.transform | <code>boolean</code> | if true, packets are converted to models |
| opts.agent | <code>Object</code> | optional node agent for ws connection (proxy) |
| opts.manageOrderBooks | <code>boolean</code> | enable local OB persistence |
| opts.manageCandles | <code>boolean</code> | enable local candle persistence |
| opts.seqAudit | <code>boolean</code> | enable sequence numbers & verification |
| opts.autoReconnect | <code>boolean</code> | if true, we will reconnect on close |
| opts.reconnectDelay | <code>number</code> | optional, defaults to 1000 (ms) |
| opts.packetWDDelay | <code>number</code> | watch-dog forced reconnection delay |

<a name="WSv2+open"></a>

### wSv2.open() ⇒ <code>Promise</code>
Opens a connection to the API server. Rejects with an error if a
connection is already open. Resolves on success

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p  
<a name="WSv2+close"></a>

### wSv2.close(code, reason) ⇒ <code>Promise</code>
Closes the active connection. If there is none, rejects with a promise.
Resolves on success

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | passed to ws |
| reason | <code>string</code> | passed to ws |

<a name="WSv2+auth"></a>

### wSv2.auth(calc) ⇒ <code>Promise</code>
Generates & sends an authentication packet to the server; if already
authenticated, rejects with an error. Resolves on success

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| calc | <code>number</code> | <code>0</code> | optional, default is 0 |

<a name="WSv2+reconnect"></a>

### wSv2.reconnect() ⇒ <code>Promise</code>
Utility method to close & re-open the ws connection. Re-authenticates if
previously authenticated

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p - resolves on completion  
<a name="WSv2+getOB"></a>

### wSv2.getOB(symbol) ⇒ <code>OrderBook</code>
Returns an up-to-date copy of the order book for the specified symbol, or
null if no OB is managed for that symbol.
Set `manageOrderBooks: true` in the constructor to use.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>OrderBook</code> - ob - null if not found  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WSv2+getCandles"></a>

### wSv2.getCandles(key) ⇒ <code>Array</code>
Fetch a reference to the full set of synced candles for the specified key.
Set `manageCandles: true` in the constructor to use.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Array</code> - candles - empty array if none exist  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="WSv2+managedSubscribe"></a>

### wSv2.managedSubscribe(channel, identifier, payload) ⇒ <code>boolean</code>
Subscribes and tracks subscriptions per channel/identifier pair. If
already subscribed to the specified pair, nothing happens.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - subSent  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> |  |
| identifier | <code>string</code> | for uniquely identifying the ref count |
| payload | <code>Object</code> | merged with sub packet |

<a name="WSv2+managedUnsubscribe"></a>

### wSv2.managedUnsubscribe(channel, identifier) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - unsubSent  

| Param | Type |
| --- | --- |
| channel | <code>string</code> | 
| identifier | <code>string</code> | 

<a name="WSv2+getChannelData"></a>

### wSv2.getChannelData(opts) ⇒ <code>Object</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Object</code> - chanData - null if not found  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.chanId | <code>number</code> |  |
| opts.channel | <code>string</code> | optional |
| opts.symbol | <code>string</code> | optional |
| opts.key | <code>string</code> | optional |

<a name="WSv2+send"></a>

### wSv2.send(msg)
Send a packet to the WS server

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>\*</code> | packet, gets stringified |

<a name="WSv2+enableSequencing"></a>

### wSv2.enableSequencing(args)
Configures the seq flag to enable sequencing (packet number) for this
connection. When enabled, the seq number will be the last value of
channel packet arrays.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> |  |
| args.audit | <code>boolean</code> | if true, an error is emitted on invalid seq |

<a name="WSv2+onServerRestart"></a>

### wSv2.onServerRestart(cb)
Register a callback in case of a ws server restart message; Use this to
call reconnect() if needed. (code 20051)

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type |
| --- | --- |
| cb | <code>method</code> | 

<a name="WSv2+onMaintenanceStart"></a>

### wSv2.onMaintenanceStart(cb)
Register a callback in case of a 'maintenance started' message from the
server. This is a good time to pause server packets until maintenance ends

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type |
| --- | --- |
| cb | <code>method</code> | 

<a name="WSv2+onMaintenanceEnd"></a>

### wSv2.onMaintenanceEnd(cb)
Register a callback to be notified of a maintenance period ending

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type |
| --- | --- |
| cb | <code>method</code> | 

<a name="WSv2+subscribe"></a>

### wSv2.subscribe(channel, payload)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> |  |
| payload | <code>Object</code> | optional extra packet data |

<a name="WSv2+subscribeTicker"></a>

### wSv2.subscribeTicker(symbol) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - subscribed  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WSv2+subscribeTrades"></a>

### wSv2.subscribeTrades(symbol) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - subscribed  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WSv2+subscribeOrderBook"></a>

### wSv2.subscribeOrderBook(symbol, prec, len) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - subscribed  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  |  |
| prec | <code>string</code> | <code>&quot;P0&quot;</code> | P0, P1, P2, or P3 (default P0) |
| len | <code>string</code> | <code>&quot;25&quot;</code> | 25 or 100 (default 25) |

<a name="WSv2+subscribeCandles"></a>

### wSv2.subscribeCandles(key) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - subscribed  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="WSv2+unsubscribe"></a>

### wSv2.unsubscribe(chanId)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type |
| --- | --- |
| chanId | <code>number</code> | 

<a name="WSv2+unsubscribeTicker"></a>

### wSv2.unsubscribeTicker(symbol) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - unsubscribed  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WSv2+unsubscribeTrades"></a>

### wSv2.unsubscribeTrades(symbol) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - unsubscribed  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WSv2+unsubscribeOrderBook"></a>

### wSv2.unsubscribeOrderBook(symbol, prec, len) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - unsubscribed  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  |  |
| prec | <code>string</code> | <code>&quot;P0&quot;</code> | P0, P1, P2, or P3 (default P0) |
| len | <code>string</code> | <code>&quot;25&quot;</code> | 25 or 100 (default 25) |

<a name="WSv2+unsubscribeCandles"></a>

### wSv2.unsubscribeCandles(symbol, frame) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - unsubscribed  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> |  |
| frame | <code>string</code> | time frame |

<a name="WSv2+removeListeners"></a>

### wSv2.removeListeners(cbGID)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type |
| --- | --- |
| cbGID | <code>string</code> | 

<a name="WSv2+requestCalc"></a>

### wSv2.requestCalc(prefixes)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type |
| --- | --- |
| prefixes | <code>Array.&lt;string&gt;</code> | 

<a name="WSv2+submitOrder"></a>

### wSv2.submitOrder(order) ⇒ <code>Promise</code>
Sends a new order to the server and resolves the returned promise once the
order submit is confirmed. Emits an error if not authenticated. The order
can be either an array, key/value map, or Order object instance.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p - resolves on submit notification  

| Param | Type |
| --- | --- |
| order | <code>Object</code> &#124; <code>Array</code> | 

<a name="WSv2+cancelOrder"></a>

### wSv2.cancelOrder(order) ⇒ <code>Promise</code>
Cancels an order by ID and resolves the returned promise once the cancel is
confirmed. Emits an error if not authenticated. The ID can be passed as a
number, or taken from an order array/object.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p  

| Param | Type |
| --- | --- |
| order | <code>Object</code> &#124; <code>Array</code> &#124; <code>number</code> | 

<a name="WSv2+cancelOrders"></a>

### wSv2.cancelOrders(orders) ⇒ <code>Promise</code>
Cancels multiple orders, returns a promise that resolves once all
operations are confirmed.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: cancelOrder  

| Param | Type |
| --- | --- |
| orders | <code>Array.&lt;Object&gt;</code> &#124; <code>Array.&lt;Array&gt;</code> &#124; <code>Array.&lt;number&gt;</code> | 

<a name="WSv2+submitOrderMultiOp"></a>

### wSv2.submitOrderMultiOp(opPayloads) ⇒ <code>Promise</code>
Sends the op payloads to the server as an 'ox_multi' command. A promise is
returned and resolves immediately if authenticated, as no confirmation is
available for this message type.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>Promise</code> - p - rejects if not authenticated  

| Param | Type |
| --- | --- |
| opPayloads | <code>Array.&lt;Object&gt;</code> | 

<a name="WSv2+isAuthenticated"></a>

### wSv2.isAuthenticated() ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - authenticated  
<a name="WSv2+isOpen"></a>

### wSv2.isOpen() ⇒ <code>boolean</code>
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**Returns**: <code>boolean</code> - open  
<a name="WSv2+onInfoMessage"></a>

### wSv2.onInfoMessage(code, cb)
Registers a new callback to be called when a matching info message is
received.

**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | from WSv2.info.* |
| cb | <code>method</code> |  |

<a name="WSv2+onMessage"></a>

### wSv2.onMessage(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onCandle"></a>

### wSv2.onCandle(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-candle  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.key | <code>string</code> | candle set key, i.e. trade:30m:tBTCUSD |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onOrderBook"></a>

### wSv2.onOrderBook(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-order-books  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.prec | <code>string</code> |  |
| opts.len | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onTrades"></a>

### wSv2.onTrades(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.pair | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onTicker"></a>

### wSv2.onTicker(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-ticker  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onOrderSnapshot"></a>

### wSv2.onOrderSnapshot(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-orders  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.gid | <code>number</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onOrderNew"></a>

### wSv2.onOrderNew(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-orders  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.gid | <code>number</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onOrderUpdate"></a>

### wSv2.onOrderUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-orders  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.gid | <code>number</code> |  |
| opts.cid | <code>number</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onOrderClose"></a>

### wSv2.onOrderClose(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-orders  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.gid | <code>number</code> |  |
| opts.cid | <code>number</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onPositionSnapshot"></a>

### wSv2.onPositionSnapshot(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onPositionNew"></a>

### wSv2.onPositionNew(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onPositionUpdate"></a>

### wSv2.onPositionUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onPositionClose"></a>

### wSv2.onPositionClose(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-position  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onTradeEntry"></a>

### wSv2.onTradeEntry(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.pair | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onTradeUpdate"></a>

### wSv2.onTradeUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.pair | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingOfferSnapshot"></a>

### wSv2.onFundingOfferSnapshot(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingOfferNew"></a>

### wSv2.onFundingOfferNew(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingOfferUpdate"></a>

### wSv2.onFundingOfferUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingOfferClose"></a>

### wSv2.onFundingOfferClose(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-offers  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingCreditSnapshot"></a>

### wSv2.onFundingCreditSnapshot(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingCreditNew"></a>

### wSv2.onFundingCreditNew(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingCreditUpdate"></a>

### wSv2.onFundingCreditUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingCreditClose"></a>

### wSv2.onFundingCreditClose(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-credits  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingLoanSnapshot"></a>

### wSv2.onFundingLoanSnapshot(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingLoanNew"></a>

### wSv2.onFundingLoanNew(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingLoanUpdate"></a>

### wSv2.onFundingLoanUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingLoanClose"></a>

### wSv2.onFundingLoanClose(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-loans  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onWalletSnapshot"></a>

### wSv2.onWalletSnapshot(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-wallets  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onWalletUpdate"></a>

### wSv2.onWalletUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-wallets  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onBalanceInfoUpdate"></a>

### wSv2.onBalanceInfoUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-balance  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onMarginInfoUpdate"></a>

### wSv2.onMarginInfoUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-margin  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingInfoUpdate"></a>

### wSv2.onFundingInfoUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-funding  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingTradeEntry"></a>

### wSv2.onFundingTradeEntry(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onFundingTradeUpdate"></a>

### wSv2.onFundingTradeUpdate(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WSv2+onNotification"></a>

### wSv2.onNotification(opts, cb)
**Kind**: instance method of <code>[WSv2](#WSv2)</code>  
**See**: https://docs.bitfinex.com/v2/reference#ws-auth-notifications  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.type | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

