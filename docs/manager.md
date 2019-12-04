<a name="WS2Manager"></a>

## WS2Manager
Provides a wrapper around the WSv2 class, opening new sockets when a
subscription would push a single socket over the data channel limit.

For more complex operations, grab a socket reference with getSocket() or
getFreeDataSocket(), or create a new WSv2 instance manually

**Kind**: global class  

* [WS2Manager](#WS2Manager)
    * [new WS2Manager(socketArgs, authArgs)](#new_WS2Manager_new)
    * _instance_
        * [.close()](#WS2Manager+close)
        * [.getNumSockets()](#WS2Manager+getNumSockets) ⇒ <code>number</code>
        * [.getSocket(i)](#WS2Manager+getSocket) ⇒ <code>Object</code>
        * [.getSocketInfo()](#WS2Manager+getSocketInfo)
        * [.auth(args)](#WS2Manager+auth)
        * [.openSocket()](#WS2Manager+openSocket) ⇒ <code>Object</code>
        * [.getFreeDataSocket()](#WS2Manager+getFreeDataSocket) ⇒ <code>Object</code>
        * [.getSocketWithDataChannel(type, filter)](#WS2Manager+getSocketWithDataChannel) ⇒ <code>Object</code>
        * [.getSocketWithChannel(chanId)](#WS2Manager+getSocketWithChannel) ⇒ <code>Object</code>
        * [.getSocketWithSubRef(channel, identifier)](#WS2Manager+getSocketWithSubRef) ⇒ <code>Object</code>
        * [.withAllSockets(cb)](#WS2Manager+withAllSockets)
        * [.subscribe(type, ident, filter)](#WS2Manager+subscribe)
        * [.unsubscribe(chanId)](#WS2Manager+unsubscribe)
        * [.subscribeTicker(symbol)](#WS2Manager+subscribeTicker)
        * [.subscribeTrades(symbol)](#WS2Manager+subscribeTrades)
        * [.subscribeOrderBook(symbol, prec, len, freq)](#WS2Manager+subscribeOrderBook)
        * [.subscribeCandles(key)](#WS2Manager+subscribeCandles)
        * [.onCandle(opts, cb)](#WS2Manager+onCandle)
        * [.onOrderBook(opts, cb)](#WS2Manager+onOrderBook)
        * [.onTrades(opts, cb)](#WS2Manager+onTrades)
        * [.onTicker(opts, cb)](#WS2Manager+onTicker)
    * _static_
        * [.getDataChannelCount(s)](#WS2Manager.getDataChannelCount) ⇒ <code>number</code>

<a name="new_WS2Manager_new"></a>

### new WS2Manager(socketArgs, authArgs)

| Param | Type | Description |
| --- | --- | --- |
| socketArgs | <code>Object</code> | passed to WSv2 constructors |
| authArgs | <code>Object</code> | cached for all internal socket auth() calls |
| authArgs.calc | <code>Object</code> | default 0 |
| authArgs.dms | <code>Object</code> | default 0 |

<a name="WS2Manager+close"></a>

### wS2Manager.close()
Closes all open sockets

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
<a name="WS2Manager+getNumSockets"></a>

### wS2Manager.getNumSockets() ⇒ <code>number</code>
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>number</code> - n  
<a name="WS2Manager+getSocket"></a>

### wS2Manager.getSocket(i) ⇒ <code>Object</code>
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Object</code> - state  

| Param | Type |
| --- | --- |
| i | <code>number</code> | 

<a name="WS2Manager+getSocketInfo"></a>

### wS2Manager.getSocketInfo()
Returns an object which can be logged to inspect the socket pool

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
<a name="WS2Manager+auth"></a>

### wS2Manager.auth(args)
Authenticates all existing & future sockets with the provided credentials.
Does nothing if an apiKey/apiSecret pair are already known.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> |  |
| args.apiKey | <code>Object</code> | saved if not already provided |
| args.apiSecret | <code>Object</code> | saved if not already provided |
| args.calc | <code>Object</code> | default 0 |
| args.dms | <code>Object</code> | dead man switch, active 4 |

<a name="WS2Manager+openSocket"></a>

### wS2Manager.openSocket() ⇒ <code>Object</code>
Creates a new socket/state instance and adds it to the internal pool. Binds
event listeners to forward via our own event emitter, and to manage pending
subs/unsubs.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Object</code> - state  
<a name="WS2Manager+getFreeDataSocket"></a>

### wS2Manager.getFreeDataSocket() ⇒ <code>Object</code>
Returns the first socket that has less active/pending channels than the
DATA_CHANNEL_LIMIT

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Object</code> - state - undefined if none found  
<a name="WS2Manager+getSocketWithDataChannel"></a>

### wS2Manager.getSocketWithDataChannel(type, filter) ⇒ <code>Object</code>
Returns the first socket that is subscribed/pending sub to the specified
channel.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Object</code> - wsState - undefined if not found  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | i.e. 'book' |
| filter | <code>Object</code> | i.e. { symbol: 'tBTCUSD', prec: 'R0' } |

<a name="WS2Manager+getSocketWithChannel"></a>

### wS2Manager.getSocketWithChannel(chanId) ⇒ <code>Object</code>
NOTE: Cannot filter against pending subscriptions, due to unknown chanId

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Object</code> - wsState - undefined if not found  

| Param | Type |
| --- | --- |
| chanId | <code>number</code> | 

<a name="WS2Manager+getSocketWithSubRef"></a>

### wS2Manager.getSocketWithSubRef(channel, identifier) ⇒ <code>Object</code>
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>Object</code> - wsState - undefined if not found  

| Param | Type |
| --- | --- |
| channel | <code>string</code> | 
| identifier | <code>string</code> | 

<a name="WS2Manager+withAllSockets"></a>

### wS2Manager.withAllSockets(cb)
Calls the provided cb with all internal socket instances

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type |
| --- | --- |
| cb | <code>function</code> | 

<a name="WS2Manager+subscribe"></a>

### wS2Manager.subscribe(type, ident, filter)
Subscribes a free data socket if available to the specified channel, or
opens a new socket & subs if needed.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | i.e. 'book' |
| ident | <code>string</code> | i.e. 'tBTCUSD' |
| filter | <code>Object</code> | i.e. { symbol: 'tBTCUSD', prec: 'R0' } |

<a name="WS2Manager+unsubscribe"></a>

### wS2Manager.unsubscribe(chanId)
Unsubscribes the first socket w/ the specified channel. Does nothing if no
such socket is found.

**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type |
| --- | --- |
| chanId | <code>number</code> | 

<a name="WS2Manager+subscribeTicker"></a>

### wS2Manager.subscribeTicker(symbol)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WS2Manager+subscribeTrades"></a>

### wS2Manager.subscribeTrades(symbol)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 

<a name="WS2Manager+subscribeOrderBook"></a>

### wS2Manager.subscribeOrderBook(symbol, prec, len, freq)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> |  | 
| prec | <code>string</code> | <code>&quot;P0&quot;</code> | 
| len | <code>string</code> | <code>&quot;25&quot;</code> | 
| freq | <code>string</code> | <code>&quot;F0&quot;</code> | 

<a name="WS2Manager+subscribeCandles"></a>

### wS2Manager.subscribeCandles(key)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="WS2Manager+onCandle"></a>

### wS2Manager.onCandle(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-candle  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.key | <code>string</code> | candle set key, i.e. trade:30m:tBTCUSD |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WS2Manager+onOrderBook"></a>

### wS2Manager.onOrderBook(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-order-books  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.prec | <code>string</code> |  |
| opts.len | <code>string</code> |  |
| opts.freq | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WS2Manager+onTrades"></a>

### wS2Manager.onTrades(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-trades  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WS2Manager+onTicker"></a>

### wS2Manager.onTicker(opts, cb)
**Kind**: instance method of [<code>WS2Manager</code>](#WS2Manager)  
**See**: https://docs.bitfinex.com/v2/reference#ws-public-ticker  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.symbol | <code>string</code> |  |
| opts.cbGID | <code>string</code> | callback group id |
| cb | <code>Method</code> |  |

<a name="WS2Manager.getDataChannelCount"></a>

### WS2Manager.getDataChannelCount(s) ⇒ <code>number</code>
**Kind**: static method of [<code>WS2Manager</code>](#WS2Manager)  
**Returns**: <code>number</code> - count - # of subscribed/pending data channels  

| Param | Type | Description |
| --- | --- | --- |
| s | <code>Object</code> | socket state |

