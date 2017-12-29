<a name="RESTv2"></a>

## RESTv2
Communicates with v2 of the Bitfinex HTTP API

**Kind**: global class  

* [RESTv2](#RESTv2)
    * [new RESTv2(opts)](#new_RESTv2_new)
    * [.ticker(symbol, cb)](#RESTv2+ticker) ⇒ <code>Promise</code>
    * [.tickers(symbols, cb)](#RESTv2+tickers) ⇒ <code>Promise</code>
    * [.stats(key, context, cb)](#RESTv2+stats) ⇒ <code>Promise</code>
    * [.candles(opts, cb)](#RESTv2+candles) ⇒ <code>Promise</code>
    * [.alertList(type, cb)](#RESTv2+alertList) ⇒ <code>Promise</code>
    * [.alertSet(type, symbol, price)](#RESTv2+alertSet) ⇒ <code>Promise</code>
    * [.alertDelete(symbol, price)](#RESTv2+alertDelete) ⇒ <code>Promise</code>
    * [.trades(symbol, start, end, limit, cb)](#RESTv2+trades) ⇒ <code>Promise</code>
    * [.wallets(cb)](#RESTv2+wallets) ⇒ <code>Promise</code>
    * [.activeOrders(cb)](#RESTv2+activeOrders) ⇒ <code>Promise</code>
    * [.orderHistory(symbol, start, end, limit, cb)](#RESTv2+orderHistory) ⇒ <code>Promise</code>
    * [.orderTrades(symbol, start, end, limit, orderID, cb)](#RESTv2+orderTrades) ⇒ <code>Promise</code>
    * [.positions(cb)](#RESTv2+positions) ⇒ <code>Promise</code>
    * [.fundingOffers(symbol, cb)](#RESTv2+fundingOffers) ⇒ <code>Promise</code>
    * [.fundingOfferHistory(symbol, start, end, limit, cb)](#RESTv2+fundingOfferHistory) ⇒ <code>Promise</code>
    * [.fundingLoans(symbol, cb)](#RESTv2+fundingLoans) ⇒ <code>Promise</code>
    * [.fundingLoanHistory(symbol, start, end, limit, cb)](#RESTv2+fundingLoanHistory) ⇒ <code>Promise</code>
    * [.fundingCredits(symbol, cb)](#RESTv2+fundingCredits) ⇒ <code>Promise</code>
    * [.fundingCreditHistory(symbol, start, end, limit, cb)](#RESTv2+fundingCreditHistory) ⇒ <code>Promise</code>
    * [.fundingTrades(symbol, start, end, limit, cb)](#RESTv2+fundingTrades) ⇒ <code>Promise</code>
    * [.marginInfo(key, cb)](#RESTv2+marginInfo) ⇒ <code>Promise</code>
    * [.fundingInfo(key, cb)](#RESTv2+fundingInfo) ⇒ <code>Promise</code>
    * [.performance(cb)](#RESTv2+performance) ⇒ <code>Promise</code>
    * [.calcAvailableBalance(symbol, dir, rate, type, cb)](#RESTv2+calcAvailableBalance) ⇒ <code>Promise</code>

<a name="new_RESTv2_new"></a>

### new RESTv2(opts)
Instantiate a new REST v2 transport.


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.apiKey | <code>string</code> |  |
| opts.apiSecret | <code>string</code> |  |
| opts.url | <code>string</code> | endpoint URL |
| opts.transform | <code>boolean</code> | default false |

<a name="RESTv2+ticker"></a>

### resTv2.ticker(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-ticker  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+tickers"></a>

### resTv2.tickers(symbols, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-tickers  

| Param | Type |
| --- | --- |
| symbols | <code>Array.&lt;string&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+stats"></a>

### resTv2.stats(key, context, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-stats  

| Param | Type | Default |
| --- | --- | --- |
| key | <code>string</code> | <code>&quot;pos.size:1m:tBTCUSD:long&quot;</code> | 
| context | <code>string</code> | <code>&quot;hist&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+candles"></a>

### resTv2.candles(opts, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: http://docs.bitfinex.com/v2/reference#rest-public-candles  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.timeframe | <code>string</code> | 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M |
| opts.symbol | <code>string</code> |  |
| opts.section | <code>string</code> | hist, last |
| cb | <code>Method</code> |  |

<a name="RESTv2+alertList"></a>

### resTv2.alertList(type, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-alert-list  

| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> | <code>&quot;price&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+alertSet"></a>

### resTv2.alertSet(type, symbol, price) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-alert-set  

| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> | <code>&quot;price&quot;</code> | 
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| price | <code>number</code> | <code>0</code> | 

<a name="RESTv2+alertDelete"></a>

### resTv2.alertDelete(symbol, price) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-alert-delete  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| price | <code>number</code> | <code>0</code> | 

<a name="RESTv2+trades"></a>

### resTv2.trades(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-trades-hist  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+wallets"></a>

### resTv2.wallets(cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-wallets  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+activeOrders"></a>

### resTv2.activeOrders(cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-orders  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+orderHistory"></a>

### resTv2.orderHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#orders-history  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+orderTrades"></a>

### resTv2.orderTrades(symbol, start, end, limit, orderID, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-order-trades  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| orderID | <code>number</code> |  | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+positions"></a>

### resTv2.positions(cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-positions  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+fundingOffers"></a>

### resTv2.fundingOffers(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingOfferHistory"></a>

### resTv2.fundingOfferHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers-hist  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingLoans"></a>

### resTv2.fundingLoans(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingLoanHistory"></a>

### resTv2.fundingLoanHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans-hist  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingCredits"></a>

### resTv2.fundingCredits(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingCreditHistory"></a>

### resTv2.fundingCreditHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits-hist  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingTrades"></a>

### resTv2.fundingTrades(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-trades-hist  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+marginInfo"></a>

### resTv2.marginInfo(key, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-info-margin  

| Param | Type | Default |
| --- | --- | --- |
| key | <code>string</code> | <code>&quot;base&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingInfo"></a>

### resTv2.fundingInfo(key, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-info-funding  

| Param | Type | Default |
| --- | --- | --- |
| key | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+performance"></a>

### resTv2.performance(cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-performance  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+calcAvailableBalance"></a>

### resTv2.calcAvailableBalance(symbol, dir, rate, type, cb) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-calc-bal-avail  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| dir | <code>string</code> |  | 
| rate | <code>number</code> |  | 
| type | <code>string</code> |  | 
| cb | <code>Method</code> |  | 

