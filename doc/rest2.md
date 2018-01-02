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
    * ~~[.symbols(cb)](#RESTv2+symbols) ⇒ <code>Promise</code>~~
    * ~~[.symbolDetails(cb)](#RESTv2+symbolDetails) ⇒ <code>Promise</code>~~
    * ~~[.accountInfo(cb)](#RESTv2+accountInfo) ⇒ <code>Promise</code>~~
    * ~~[.accountFees(cb)](#RESTv2+accountFees) ⇒ <code>Promise</code>~~
    * ~~[.accountSummary(cb)](#RESTv2+accountSummary) ⇒ <code>Promise</code>~~
    * ~~[.deposit(params, cb)](#RESTv2+deposit) ⇒ <code>Promise</code>~~
    * ~~[.withdraw(params, cb)](#RESTv2+withdraw) ⇒ <code>Promise</code>~~
    * ~~[.transfer(params, cb)](#RESTv2+transfer) ⇒ <code>Promise</code>~~
    * ~~[.keyPermissions(cb)](#RESTv2+keyPermissions) ⇒ <code>Promise</code>~~
    * ~~[.balances(cb)](#RESTv2+balances) ⇒ <code>Promise</code>~~
    * ~~[.claimPosition(params, cb)](#RESTv2+claimPosition) ⇒ <code>Promise</code>~~

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
| opts.agent | <code>Object</code> | optional node agent for connection (proxy) |

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

<a name="RESTv2+symbols"></a>

### ~~resTv2.symbols(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Get a list of valid symbol names

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-symbols  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+symbolDetails"></a>

### ~~resTv2.symbolDetails(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Get a list of valid symbol names and details

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-symbol-details  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+accountInfo"></a>

### ~~resTv2.accountInfo(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request information about your account

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-account-info  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+accountFees"></a>

### ~~resTv2.accountFees(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request account withdrawl fees

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-fees  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+accountSummary"></a>

### ~~resTv2.accountSummary(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Returns a 30-day summary of your trading volume and return on margin
funding.

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-summary  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+deposit"></a>

### ~~resTv2.deposit(params, cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request a deposit address

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-deposit  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> |  |
| params.request | <code>string</code> |  |
| params.nonce | <code>string</code> |  |
| params.method | <code>string</code> | name of currency |
| params.wallet_name | <code>string</code> | 'trading', 'exchange' or 'deposit' |
| params.renew | <code>number</code> | 1 or 0 |
| cb | <code>Method</code> |  |

<a name="RESTv2+withdraw"></a>

### ~~resTv2.withdraw(params, cb) ⇒ <code>Promise</code>~~
***Deprecated***

Requests a withdrawl from a wallet

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-withdrawal  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> |  |
| params.withdraw_type | <code>string</code> | name of currency |
| params.walletselected | <code>string</code> | 'trading', 'exchange, or 'deposit' |
| params.amount | <code>string</code> |  |
| params.address | <code>string</code> |  |
| params.payment_id | <code>string</code> | optional, for monero |
| params.account_name | <code>string</code> |  |
| params.account_number | <code>string</code> |  |
| params.swift | <code>string</code> |  |
| params.bank_name | <code>string</code> |  |
| params.bank_address | <code>string</code> |  |
| params.bank_city | <code>string</code> |  |
| params.bank_country | <code>string</code> |  |
| params.detail_payment | <code>string</code> | message to beneficiary |
| params.expressWire | <code>number</code> | 1 or 0 |
| params.intermediary_bank_name | <code>string</code> |  |
| params.intermediary_bank_address | <code>string</code> |  |
| params.intermediary_bank_city | <code>string</code> |  |
| params.intermediary_bank_country | <code>string</code> |  |
| params.intermediary_bank_account | <code>string</code> |  |
| params.intermediary_bank_swift | <code>string</code> |  |
| cb | <code>Method</code> |  |

<a name="RESTv2+transfer"></a>

### ~~resTv2.transfer(params, cb) ⇒ <code>Promise</code>~~
***Deprecated***

Execute a balance transfer between wallets

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-transfer-between-wallets  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> |  |
| params.amount | <code>number</code> | amount to transfer |
| params.currency | <code>string</code> | currency of funds to transfer |
| params.walletFrom | <code>string</code> | wallet to transfer from |
| params.walletTo | <code>string</code> | wallet to transfer to |
| cb | <code>Method</code> |  |

<a name="RESTv2+keyPermissions"></a>

### ~~resTv2.keyPermissions(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Fetch the permissions of the key being used to generate this request

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#auth-key-permissions  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+balances"></a>

### ~~resTv2.balances(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request your wallet balances

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+claimPosition"></a>

### ~~resTv2.claimPosition(params, cb) ⇒ <code>Promise</code>~~
***Deprecated***

**Kind**: instance method of <code>[RESTv2](#RESTv2)</code>  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-claim-position  

| Param | Type |
| --- | --- |
| params | <code>Object</code> | 
| params.position_id | <code>number</code> | 
| params.amount | <code>number</code> | 
| cb | <code>Method</code> | 

