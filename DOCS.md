<a name="BitfinexWS"></a>
## BitfinexWS
**Kind**: global class  

* [BitfinexWS](#BitfinexWS)
    * [new BitfinexWS(APIKey, APISecret)](#new_BitfinexWS_new)
    * _instance_
        * [.subscribeOrderBook([pair], [precision], [length])](#BitfinexWS+subscribeOrderBook)
        * [.subscribeTrades([pair])](#BitfinexWS+subscribeTrades)
        * [.subscribeTicker([pair])](#BitfinexWS+subscribeTicker)
        * [.unsubscribe(chanId)](#BitfinexWS+unsubscribe)
        * [.auth()](#BitfinexWS+auth)
        * ["message"](#BitfinexWS+event_message)
        * ["open"](#BitfinexWS+event_open)
        * ["error"](#BitfinexWS+event_error)
        * ["close"](#BitfinexWS+event_close)
        * ["subscribed"](#BitfinexWS+event_subscribed)
        * ["auth"](#BitfinexWS+event_auth)
        * ["ps"](#BitfinexWS+event_ps)
        * ["pn"](#BitfinexWS+event_pn)
        * ["pu"](#BitfinexWS+event_pu)
        * ["pc"](#BitfinexWS+event_pc)
        * ["ws"](#BitfinexWS+event_ws)
        * ["ws"](#BitfinexWS+event_ws)
        * ["os"](#BitfinexWS+event_os)
        * ["on"](#BitfinexWS+event_on)
        * ["ou"](#BitfinexWS+event_ou)
        * ["oc"](#BitfinexWS+event_oc)
        * ["te"](#BitfinexWS+event_te)
        * ["tu"](#BitfinexWS+event_tu)
        * ["ticker"](#BitfinexWS+event_ticker)
        * ["trade"](#BitfinexWS+event_trade)
        * ["trade"](#BitfinexWS+event_trade)
        * ["orderbook"](#BitfinexWS+event_orderbook)
    * _static_
        * [.WebSocketURI](#BitfinexWS.WebSocketURI) : <code>String</code>

<a name="new_BitfinexWS_new"></a>
### new BitfinexWS(APIKey, APISecret)
Handles communitaction with Bitfinex WebSocket API.


| Param | Type |
| --- | --- |
| APIKey | <code>sting</code> | 
| APISecret | <code>string</code> | 

<a name="BitfinexWS+subscribeOrderBook"></a>
### bitfinexWS.subscribeOrderBook([pair], [precision], [length])
Subscribe to Order book updates. Snapshot will be sended as multiple updates.
Event will be emited as `PAIRNAME_book`.

**Kind**: instance method of <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#order-books  

| Param | Type | Description |
| --- | --- | --- |
| [pair] | <code>string</code> | BTCUSD, LTCUSD or LTCBTC. Default BTCUSD |
| [precision] | <code>string</code> | Level of price aggregation (P0, P1, P2, P3).                              The default is P0. |
| [length] | <code>string</code> | Number of price points. 25 (default) or 100. |

<a name="BitfinexWS+subscribeTrades"></a>
### bitfinexWS.subscribeTrades([pair])
Subscribe to trades. Snapshot will be sended as multiple updates.
Event will be emited as `PAIRNAME_trades`.

**Kind**: instance method of <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#trades75  

| Param | Type | Description |
| --- | --- | --- |
| [pair] | <code>string</code> | BTCUSD, LTCUSD or LTCBTC. Default BTCUSD |

<a name="BitfinexWS+subscribeTicker"></a>
### bitfinexWS.subscribeTicker([pair])
Subscribe to ticker updates. The ticker is a high level overview of the state
of the market. It shows you the current best bid and ask, as well as the last
trade price.

Event will be emited as `PAIRNAME_ticker`.

**Kind**: instance method of <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#ticker76  

| Param | Type | Description |
| --- | --- | --- |
| [pair] | <code>string</code> | BTCUSD, LTCUSD or LTCBTC. Default BTCUSD |

<a name="BitfinexWS+unsubscribe"></a>
### bitfinexWS.unsubscribe(chanId)
Unsubscribe to a channel.

**Kind**: instance method of <code>[BitfinexWS](#BitfinexWS)</code>  

| Param | Type | Description |
| --- | --- | --- |
| chanId | <code>number</code> | ID of the channel received on `subscribed` event. |

<a name="BitfinexWS+auth"></a>
### bitfinexWS.auth()
Autenticate the user. Will receive executed traded updates.

**Kind**: instance method of <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#wallet-updates  
<a name="BitfinexWS+event_message"></a>
### "message"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_open"></a>
### "open"
WebSocket connection is open. Ready to send.

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_error"></a>
### "error"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_close"></a>
### "close"
WebSocket connection is closed.

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_subscribed"></a>
### "subscribed"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | Channel type |
| pair | <code>string</code> | Currency pair. |
| chanId | <code>number</code> | Channel ID sended by Bitfinex |

<a name="BitfinexWS+event_auth"></a>
### "auth"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_ps"></a>
### "ps"
position snapshot

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_pn"></a>
### "pn"
new position

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_pu"></a>
### "pu"
position update

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_pc"></a>
### "pc"
position close

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_ws"></a>
### "ws"
wallet snapshot

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_ws"></a>
### "ws"
wallet snapshot

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_os"></a>
### "os"
order snapshot

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_on"></a>
### "on"
new order

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_ou"></a>
### "ou"
order update

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_oc"></a>
### "oc"
order cancel

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_te"></a>
### "te"
trade executed

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_tu"></a>
### "tu"
trade execution update

**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
<a name="BitfinexWS+event_ticker"></a>
### "ticker"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
**Properties**

| Name | Type |
| --- | --- |
| bid | <code>number</code> | 
| bidSize | <code>number</code> | 
| ask | <code>number</code> | 
| askSize | <code>number</code> | 
| dailyChange | <code>number</code> | 
| dailyChangePerc | <code>number</code> | 
| lastPrice | <code>number</code> | 
| volume | <code>number</code> | 
| high | <code>number</code> | 
| low | <code>number</code> | 

<a name="BitfinexWS+event_trade"></a>
### "trade"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#trades75  
**Properties**

| Name | Type |
| --- | --- |
| seq | <code>string</code> | 
| timestamp | <code>number</code> | 
| price | <code>number</code> | 
| amount | <code>number</code> | 

<a name="BitfinexWS+event_trade"></a>
### "trade"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#trades75  
**Properties**

| Name | Type |
| --- | --- |
| seq | <code>string</code> | 
| id | <code>number</code> | 
| timestamp | <code>number</code> | 
| price | <code>number</code> | 
| amount | <code>number</code> | 

<a name="BitfinexWS+event_orderbook"></a>
### "orderbook"
**Kind**: event emitted by <code>[BitfinexWS](#BitfinexWS)</code>  
**See**: http://docs.bitfinex.com/#order-books  
**Properties**

| Name | Type |
| --- | --- |
| price | <code>string</code> | 
| count | <code>number</code> | 
| amount | <code>number</code> | 

<a name="BitfinexWS.WebSocketURI"></a>
### BitfinexWS.WebSocketURI : <code>String</code>
**Kind**: static constant of <code>[BitfinexWS](#BitfinexWS)</code>  
