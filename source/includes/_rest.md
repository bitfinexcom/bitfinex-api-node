# REST

## General

### URL

```javascript
var url = "https://api.bitfinex.com/v1"
```

```go
var url = "https://api.bitfinex.com/v1/"
```

`https://api.bitfinex.com/v1`

### Authentication

```javascript
var payload = {
  "request": "/v1/account_infos",
  "nonce": Date.now().toString()
};
```

```go
payload := map[string]interface{}{
	"request": "/v1/account_infos",
	"nonce":   fmt.Sprintf("%v", time.Now().Unix()*10000),
}
```

Authentication is done using an API key and a secret. To generate this pair,
go to the [API Access](https://www.bitfinex.com/account/api) page.
As an example of how to authenticate, we can look at the "account_infos" endpoint.
Take the example payload to the right.

<aside class="warning">
The nonce provided must be strictly increasing.
</aside>

```javascript
//Using the "request" library, available via npm.
//From the console, run npm install request
var
  request = require('request'),
  api_key = "<Your API key here>",
  api_secret = "<Your API secret here>";
payload = new Buffer(JSON.stringify(payload))
  .toString('base64');
var
  signature = crypto
  .createHmac("sha384", api_secret)
  .update(payload)
  .digest('hex'),
  headers = {
    'X-BFX-APIKEY': api_key,
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  options = {
    url: url + '/account_infos',
    headers: headers,
    body: payload
  };
request.post(options,
  function(error, response, body) {
    console.log(body);
});
```

```go
// Full example of authenticated request
package main

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

func main() {
	API_KEY := "..."
	API_SECRET := "..."

	url := "https://api.bitfinex.com/v1/"
	req, err := http.NewRequest("POST", url+"/account_infos", nil)
	if err != nil {
		log.Fatal(err)
	}

	payload := map[string]interface{}{
		"request": "/v1/account_infos",
		"nonce":   fmt.Sprintf("%v", time.Now().Unix()*10000),
	}

	payload_json, _ := json.Marshal(payload)
	payload_enc := base64.StdEncoding.EncodeToString(payload_json)

	sig := hmac.New(sha512.New384, []byte(API_SECRET))
	sig.Write([]byte(payload_enc))

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")
	req.Header.Add("X-BFX-APIKEY", API_KEY)
	req.Header.Add("X-BFX-PAYLOAD", payload_enc)
	req.Header.Add("X-BFX-SIGNATURE", hex.EncodeToString(sig.Sum(nil)))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(string(body))
}
```

The authentications procedures is as follows:

* The payload is the parameters object, first JSON encoded, and then encoded into Base64

`payload = parameters-object -> JSON encode -> base64`

* The signature is the hex digest of an HMAC-SHA384 hash where the message is your payload, and the secret key is your API secret.

`signature = HMAC-SHA384(payload, api-secret).digest('hex')`

`send (api-key, payload, signature)`

These are encoded as HTTP headers named:

* X-BFX-APIKEY
* X-BFX-PAYLOAD
* X-BFX-SIGNATURE

### Parameters
Requests parameters for POST requests (authenticated) (presented below in the "Request" sections)
are part of the PAYLOAD, not GET parameters.

Requests parameters for GET requests (non-authenticated) are GET parameters,
appended to the URL being called as follows:

`/v1/call/?parameter=value`

## Public Endpoints
```javascript
// All examples assume the following:
// 1. You already have the request object available
// 2. You have the url variable
// 3. Will use BTCUSD as the default symbol
var request = require('request')
var url = "https://api.bitfinex.com/v1"
```
<aside class="notice">
All Public Endpoints use GET requests
</aside>
### Ticker
> **Request**

```javascript
request.get(url + "/pubticker/:symbol",
  function(error, response, body) {
    console.log(body);
});
```

> **Response**

```json
{
  "mid":"244.755",
  "bid":"244.75",
  "ask":"244.76",
  "last_price":"244.82",
  "low":"244.2",
  "high":"248.19",
  "volume":"7842.11542563",
  "timestamp":"1444253422.348340958"
}
```
**Endpoint**

`/pubticker/:symbol`

**Description**

Gives innermost bid and asks and information on the most recent trade,
as well as high, low and volume of the last 24 hours.

**Response Details**

Key	|Type	|Description
--- |---|---
mid	| [price] |	(bid + ask) / 2
bid | [price] | Innermost bid.
ask	| [price] |	Innermost ask.
last_price |	[price] |	The price at which the last order executed.
low	| [price]|	Lowest trade price of the last 24 hours
high	|[price]|	Highest trade price of the last 24 hours
volume	|[price]	|Trading volume of the last 24 hours
timestamp|	[time]|	The timestamp at which this information was valid.

### Stats
> **Request**

```javascript
request.get(url + "/stats/BTCUSD",
  function(error, response, body) {
    console.log(body);
});
```

> **Response**

```json
[{
  "period":1,
  "volume":"7967.96766158"
},{
  "period":7,
  "volume":"55938.67260266"
},{
  "period":30,
  "volume":"275148.09653645"
}]
```
**Endpoint**

`/stats/:symbol`

**Description**

Various statistics about the requested pair.

**Response Details**
An array of the following:

Key | Type | Description
--- | --- | ---
period | [integer] | period covered in days
volume |[price] | volume

### Fundingbook
> **Request**

```javascript
var payload = {
  "limit_bids": 1,
  "limit_asks": 1
};
var options = {
  url: url + '/lendbook/USD',
  qs: payload
};
request.get(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "bids":[{
    "rate":"9.1287",
    "amount":"5000.0",
    "period":30,
    "timestamp":"1444257541.0",
    "frr":"No"
  }],
  "asks":[{
    "rate":"8.3695",
    "amount":"407.5",
    "period":2,
    "timestamp":"1444260343.0",
    "frr":"No"
  }]
}
```

**Endpoint**

`/lendbook/:currency`

**Description**

Get the full margin funding book

**Request Details**
<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Required<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Default<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>limit_bids</strong></td>
            <td>false</td>
            <td>[int]</td>
            <td>50</td>
            <td>Limit the number of funding bids returned. May be 0 in which case the array of bids is empty.</td>
          </tr>
          <tr>
            <td><strong>limit_asks</strong></td>
            <td>false</td>
            <td>[int]</td>
            <td>50</td>
            <td>Limit the number of funding offers returned. May be 0 in which case the array of asks is empty.</td>
          </tr>

          </tbody>
          </table>

**Response Details**
<table class>
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>bids</strong></td>
            <td>[array of funding bids]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>rate</strong></td>
            <td>[rate in % per 365 days]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>period</strong></td>
            <td>[days]</td>
            <td>minimum period for the margin funding contract</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>frr</strong></td>
            <td>[yes/no]</td>
            <td>"Yes" if the offer is at Flash Return Rate, "No" if the offer is at fixed rate</td>
          </tr>
          <tr>
            <td><strong>asks</strong></td>
            <td>[array of funding offers]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>rate</strong></td>
            <td>[rate in % per 365 days]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>period</strong></td>
            <td>[days]</td>
            <td>maximum period for the funding contract</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>frr</strong></td>
            <td>[yes/no]</td>
            <td>"Yes" if the offer is at Flash Return Rate, "No" if the offer is at fixed rate</td>
          </tr>
          </tbody>
          </table>
### Orderbook

> **Request**

```javascript
var payload = {
  "limit_bids": 1,
  "limit_asks": 1,
  "group": 0
};
var options = {
  url: url + '/book/BTCUSD',
  qs: payload
};
request.get(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "bids":[{
    "rate":"9.1287",
    "amount":"5000.0",
    "period":30,
    "timestamp":"1444257541.0",
    "frr":"No"
  }],
  "asks":[{
    "rate":"8.3695",
    "amount":"407.5",
    "period":2,
    "timestamp":"1444260343.0",
    "frr":"No"
  }]
}
```

**Endpoint**

`/book/:symbol`

**Description**

Get the full order book.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Required<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Default<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>limit_bids</strong></td>
            <td>false</td>
            <td>[int]</td>
            <td>50</td>
            <td>Limit the number of bids returned. May be 0 in which case the array of bids is empty.</td>
          </tr>
          <tr>
            <td><strong>limit_asks</strong></td>
            <td>false</td>
            <td>[int]</td>
            <td>50</td>
            <td>Limit the number of asks returned. May be 0 in which case the array of asks is empty.</td>
          </tr>
          <tr>
            <td><strong>group</strong></td>
            <td>false</td>
            <td>[0/1]</td>
            <td>1</td>
            <td>If 1, orders are grouped by price in the orderbook. If 0, orders are not grouped and sorted individually</td>
          </tr>

          </tbody>
          </table>

**Response Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>
          <tr>
            <td><strong>bids</strong></td>
            <td>[array]</td>
          </tr>
          <tr>
            <td><strong>price</strong></td>
            <td>[price]</td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
          </tr>
          <tr>
            <td><strong>asks</strong></td>
            <td>[array]</td>
          </tr>
          <tr>
            <td><strong>price</strong></td>
            <td>[price]</td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
          </tr>
          </tbody>
          </table>

### Trades

> **Request**

```javascript
var payload = {
  "timestamp": false,
  "limit_trades": 1
};
var options = {
  url: url + '/trades/BTCUSD',
  qs: payload
};
request.get(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "timestamp":1444266681,
  "tid":11988919,
  "price":"244.8",
  "amount":"0.03297384",
  "exchange":"bitfinex",
  "type":"sell"
}]
```

**Endpoint**

`/trades/:symbol`

**Description**

Get a list of the most recent trades for the given symbol.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Required<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Default<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>timestamp</strong></td>
            <td>false</td>
            <td>[time]</td>
            <td></td>
            <td>Only show trades at or after this timestamp.</td>
          </tr>
          <tr>
            <td><strong>limit_trades</strong></td>
            <td>false</td>
            <td>[int]</td>
            <td>50</td>
            <td>Limit the number of trades returned. Must be &gt;= 1.</td>
          </tr>

          </tbody>
          </table>

**Response Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>tid</strong></td>
            <td>[integer]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>price</strong></td>
            <td>[price]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>exchange</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>type</strong></td>
            <td>[string]</td>
            <td>"sell" or "buy" (can be "" if undetermined)</td>
          </tr>
          </tbody>
          </table>

### Lends

> **Request**

```javascript
var payload = {
  "timestamp": false,
  "limit_lends": 1
},
options = {
  url: url + '/lends/USD',
  qs: payload
};
request.get(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "rate":"9.8998",
  "amount_lent":"22528933.77950878",
  "amount_used":"0.0",
  "timestamp":1444264307
}]
```

**Endpoint**

/lends/:currency

**Description**

Get a list of the most recent funding data for the given currency: total amount lent and Flash Return Rate (in % by 365 days) over time.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Required<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Default<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>timestamp</strong></td>
            <td>false</td>
            <td>[time]</td>
            <td></td>
            <td>Only show data at or after this timestamp.</td>
          </tr>
          <tr>
            <td><strong>limit_lends</strong></td>
            <td>false</td>
            <td>[int]</td>
            <td>50</td>
            <td>Limit the amount of funding data returned. Must be &gt;= 1</td>
          </tr>

          </tbody>
          </table>

**Response Details*

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>rate</strong></td>
            <td>[decimal, % by 365 days]</td>
            <td>Average rate of total funding received at fixed rates, ie past Flash Return Rate annualized</td>
          </tr>
          <tr>
            <td><strong>amount_lent</strong></td>
            <td>[decimal]</td>
            <td>Total amount of open margin funding in the given currency</td>
          </tr>
          <tr>
            <td><strong>amount_used</strong></td>
            <td>[decimal]</td>
            <td>Total amount of open margin funding used in a margin position in the given currency</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td></td>
          </tr>
          </tbody>
          </table>

### Symbols

> **Request**

```javascript
var options = {
  url: url + '/symbols',
  qs: {}
};
request.get(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
["btcusd","ltcusd","ltcbtc"]
```

**Endpoint**

`/symbols`

**Description**

Get a list of valid symbol IDs.

**Response Details**

A list of symbol names. Currently "btcusd", "ltcusd", "ltcbtc"

### Symbol Details
> **Request**

```javascript
var options = {
  url: url + '/symbols_details',
  qs: {}
};
request.get(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "pair":"btcusd",
  "price_precision":5,
  "initial_margin":"30.0",
  "minimum_margin":"15.0",
  "maximum_order_size":"2000.0",
  "minimum_order_size":"0.01",
  "expiration":"NA"
},{
  "pair":"ltcusd",
  "price_precision":5,
  "initial_margin":"30.0",
  "minimum_margin":"15.0",
  "maximum_order_size":"5000.0",
  "minimum_order_size":"0.1",
  "expiration":"NA"
},{
  "pair":"ltcbtc",
  "price_precision":5,
  "initial_margin":"30.0",
  "minimum_margin":"15.0",
  "maximum_order_size":"5000.0",
  "minimum_order_size":"0.1",
  "expiration":"NA"
}]
```

**Endpoint**

/symbols_details

**Description**

Get a list of valid symbol IDs and the pair details.

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>pair</strong></td>
              <td>[string]</td>
              <td>the pair code</td>
            </tr>
            <tr>
              <td><strong>price_precision</strong></td>
              <td>[integer]</td>
              <td>Maximum number of significant digits for price in this pair</td>
            </tr>
            <tr>
              <td><strong>initial_margin</strong></td>
              <td>[decimal]</td>
              <td>Initial margin required to open a position in this pair</td>
            </tr>
            <tr>
              <td><strong>minimum_margin</strong></td>
              <td>[decimal]</td>
              <td>Minimal margin to maintain (in %)</td>
            </tr>
            <tr>
              <td><strong>maximum_order_size</strong></td>
              <td>[decimal]</td>
              <td>Maximum order size of the pair</td>
            </tr>
            <tr>
              <td><strong>expiration</strong></td>
              <td>[string]</td>
              <td>Expiration date for limited contracts/pairs</td>
            </tr>

            </tbody>
            </table>

## Authenticated Endpoints

```javascript
// All examples assume the following:
// 1. You are using the provided example request object
// 2. You use your API key and secret
// 3. BTCUSD is the default symbol
var
  request = require('request'),
  api_key = "<Your API key>",
  api_secret = "<Your API secret>",
  baseRequest = request.defaults({
    headers: {
        'X-BFX-APIKEY': api_key,
    },
    baseUrl: "https://api.bitfinex.com/v1"
  });
```
<aside class="notice">
All Authenticated Endpoints use POST requests
</aside>
### Account info

> **Request**

```javascript
var payload = {
  "request": "/v1/account_infos",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/account_infos",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "maker_fees":"0.1",
  "taker_fees":"0.2",
  "fees":[{
    "pairs":"BTC",
    "maker_fees":"0.1",
    "taker_fees":"0.2"
   },{
    "pairs":"LTC",
    "maker_fees":"0.1",
    "taker_fees":"0.2"
   },
   {
    "pairs":"DRK",
    "maker_fees":"0.1",
    "taker_fees":"0.2"
  }]
}]
```

**Endpoint**

`/account_infos`

**Description**

Return information about your account (trading fees).

**Response Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>pairs</strong></td>
            <td>[string]</td>
            <td>The currency included in the pairs with this fee schedule</td>
          </tr>
          <tr>
            <td><strong>maker_fees</strong></td>
            <td>[decimal]</td>
            <td>Your current fees for maker orders (limit orders not marketable, in percent)</td>
          </tr>
          <tr>
            <td><strong>taker_fees</strong></td>
            <td>[decimal]</td>
            <td>Your current fees for taker orders (marketable order, in percent)</td>
          </tr>

          </tbody>
          </table>

### Deposit

> **Request**

```javascript
var payload = {
  "request": "/v1/deposit/new",
  "nonce": Date.now().toString(),
  "method": "bitcoin",
  "wallet_name": "exchange",
  "renew": 0
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/deposit/new",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "result":"success",
  "method":"bitcoin",
  "currency":"BTC",
  "address":"3FdY9coNq47MLiKhG2FLtKzdaXS3hZpSo4"
}
```

**Endpoint**

`/deposit/new`

**Description**

Return your deposit address to make a new deposit.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>method</strong></td>
            <td>[string]</td>
            <td>Method of deposit (methods accepted: "bitcoin", "litecoin", "darkcoin", "mastercoin" (tethers)).</td>
          </tr>
          <tr>
            <td><strong>wallet_name</strong></td>
            <td>[string]</td>
            <td>Wallet to deposit in (accepted: "trading", "exchange", "deposit"). Your wallet needs to already exist</td>
          </tr>
          <tr>
            <td><strong>renew</strong></td>
            <td>[integer]</td>
            <td>(optional) Default is 0. If set to 1, will return a new unused deposit address</td>
          </tr>

          </tbody>
          </table>

**Response Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>result</strong></td>
            <td>[string]</td>
            <td>"success" or "error"</td>
          </tr>
          <tr>
            <td><strong>method</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>currency</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>address</strong></td>
            <td>[string]</td>
            <td>The deposit address (or error message if result = "error")</td>
          </tr>

          </tbody>
          </table>
### Orders

#### New Order

> **Request**

```javascript
var payload = {
  "request": "/v1/order/new",
  "nonce": Date.now().toString(),
  "symbol": "BTCUSD",
  "amount":"0.01",
  "price": "0.01",
  "exchange": "bitfinex",
  "side": "buy",
  "type": "exchange limit"
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/order/new",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":448364249,
  "symbol":"btcusd",
  "exchange":"bitfinex",
  "price":"0.01",
  "avg_execution_price":"0.0",
  "side":"buy",
  "type":"exchange limit",
  "timestamp":"1444272165.252370982",
  "is_live":true,
  "is_cancelled":false,
  "is_hidden":false,
  "was_forced":false,
  "original_amount":"0.01",
  "remaining_amount":"0.01",
  "executed_amount":"0.0",
  "order_id":448364249
}
```

**Endpoint**

`/order/new`

**Description**

Submit a new order.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>symbol</strong></td>
              <td>[string]</td>
              <td>The name of the symbol (see `/symbols`).</td>
            </tr>
            <tr>
              <td><strong>amount</strong></td>
              <td>[decimal]</td>
              <td>Order size: how much to buy or sell.</td>
            </tr>
            <tr>
              <td><strong>price</strong></td>
              <td>[price]</td>
              <td>Price to buy or sell at. Must be positive. Use random number for market orders.</td>
            </tr>
            <tr>
              <td><strong>exchange</strong></td>
              <td>[string]</td>
              <td>"bitfinex"</td>
            </tr>
            <tr>
              <td><strong>side</strong></td>
              <td>[string]</td>
              <td>Either "buy" or "sell".</td>
            </tr>
            <tr>
              <td><strong>type</strong></td>
              <td>[string]</td>
              <td>Either "market" / "limit" / "stop" / "trailing-stop" / "fill-or-kill" / "exchange market" / "exchange limit" / "exchange stop" / "exchange trailing-stop" / "exchange fill-or-kill". (type starting by "exchange " are exchange orders, others are margin trading orders)</td>
            </tr>
            <tr>
              <td><strong>is_hidden</strong></td>
              <td>[bool]</td>
              <td>true if the order should be hidden. Default is false.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_id</strong></td>
              <td>[int]</td>
              <td>An order object containing the order's ID as well as all the information provided by /order/status</td>
            </tr>
            </tbody>
            </table>
**Order Types**

<table class="striped">
              <thead>
              <tr>
                <th class="sortable">Margin trading type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Exchange type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <td>LIMIT</td>
                <td>EXCHANGE LIMIT</td>
              </tr>
              <tr>
                <td>MARKET</td>
                <td>EXCHANGE MARKET</td>
              </tr>
              <tr>
                <td>STOP</td>
                <td>EXCHANGE STOP</td>
              </tr>
              <tr>
                <td>TRAILING STOP</td>
                <td>EXCHANGE TRAILING STOP</td>
              </tr>
                  <tr>
                    <td>FILL-OR-KILL</td>
                    <td>EXCHANGE FILL-OR-KILL</td>
                  </tr>
              </tbody>
            </table>

#### Multiple new orders

> **Request**

```javascript
var payload = {
  "request": "/v1/order/new/multi",
  "nonce": Date.now().toString(),
  "orders": [{
    "symbol": "BTCUSD",
    "amount": "0.01",
    "price": "0.01",
    "exchange": "bitfinex",
    "side": "buy",
    "type": "exchange limit"
  },{
    "symbol": "BTCUSD",
    "amount": "0.02",
    "price": "0.03",
    "exchange": "bitfinex",
    "side": "buy",
    "type": "exchange limit"
  }]
};

payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
    url: "/order/new/multi",
    headers: {
        'X-BFX-PAYLOAD': payload,
        'X-BFX-SIGNATURE': signature
    },
    body: payload
};
baseRequest.post(options, function (error, response, body) {
    console.log(body);
});
```

> **Response**

```json
{
  "order_ids":[{
    "id":448383727,
    "symbol":"btcusd",
    "exchange":"bitfinex",
    "price":"0.01",
    "avg_execution_price":"0.0",
    "side":"buy",
    "type":"exchange limit",
    "timestamp":"1444274013.621701916",
    "is_live":true,
    "is_cancelled":false,
    "is_hidden":false,
    "was_forced":false,
    "original_amount":"0.01",
    "remaining_amount":"0.01",
    "executed_amount":"0.0"
  },{
    "id":448383729,
    "symbol":"btcusd",
    "exchange":"bitfinex",
    "price":"0.03",
    "avg_execution_price":"0.0",
    "side":"buy",
    "type":"exchange limit",
    "timestamp":"1444274013.661297306",
    "is_live":true,
    "is_cancelled":false,
    "is_hidden":false,
    "was_forced":false,
    "original_amount":"0.02",
    "remaining_amount":"0.02",
    "executed_amount":"0.0"
  }],
  "status":"success"
}
```

**Endpoint**

`/order/new/multi`

**Description**

Submit several new orders at once.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>symbol</strong></td>
              <td>[string]</td>
              <td>The name of the symbol (see `/symbols`).</td>
            </tr>
            <tr>
              <td><strong>amount</strong></td>
              <td>[decimal]</td>
              <td>Order size: how much to buy or sell.</td>
            </tr>
            <tr>
              <td><strong>price</strong></td>
              <td>[price]</td>
              <td>Price to buy or sell at. May omit if a market order.</td>
            </tr>
            <tr>
              <td><strong>exchange</strong></td>
              <td>[string]</td>
              <td>"bitfinex", "bitstamp", "all" (for no routing).</td>
            </tr>
            <tr>
              <td><strong>side</strong></td>
              <td>[string]</td>
              <td>Either "buy" or "sell".</td>
            </tr>
            <tr>
              <td><strong>type</strong></td>
              <td>[string]</td>
              <td>Either "market" / "limit" / "stop" / "trailing-stop" / "fill-or-kill".</td>
            </tr>

            </tbody>
            </table>

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_ids</strong></td>
              <td>[array]</td>
              <td>An array of order objects each having their own unique ID, as well as the information given by /order/status for each of the orders opened.</td>
            </tr>
            </tbody>
            </table>


#### Cancel order
> **Request**

```javascript
var payload = {
  "request": "/v1/order/cancel",
  "nonce": Date.now().toString(),
  "order_id": 448364249
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/order/cancel",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function (error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":446915287,
  "symbol":"btcusd",
  "exchange":null,
  "price":"239.0",
  "avg_execution_price":"0.0",
  "side":"sell",
  "type":"trailing stop",
  "timestamp":"1444141982.0",
  "is_live":true,
  "is_cancelled":false,
  "is_hidden":false,
  "was_forced":false,
  "original_amount":"1.0",
  "remaining_amount":"1.0",
  "executed_amount":"0.0"
}
```

**Endpoint**

`/order/cancel`

**Description**

Cancel an order.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_id</strong></td>
              <td>[int]</td>
              <td>The order ID given by `/order/new`.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

Result of /order/status for the cancelled order.

#### Cancel multiple orders

> **Request**

```javascript
var payload = {
  "request": "/v1/order/cancel/multi",
  "nonce": Date.now().toString(),
  "order_ids": [448402101, 448402099]
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/order/cancel/multi",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function (error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{"result":"Orders cancelled"}
```

**Endpoint**

`/order/cancel/multi`

**Description**

Cancel multiples orders at once.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_ids</strong></td>
              <td>[array]</td>
              <td>An array of the order IDs given by `/order/new` or `/order/new/multi`</td>
            </tr>
            </tbody>
            </table>

**Response Details**

Confirmation of cancellation of the orders.

#### Cancel all orders

> **Request**

```javascript
var payload = {
  "request": "/v1/order/cancel/all",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/order/cancel/all",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function (error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{"result":"All orders cancelled"}
```

**Endpoint**

`/order/cancel/all`

**Description**

Cancel all active orders at once.

**Request Details**

No arguments required

**Response Details**

Confirmation of cancellation of the orders.

#### Replace order

> **Request**

```javascript
var payload = {
  "order_id": 448411153,
  "request": "/v1/order/cancel/replace",
  "nonce": Date.now().toString(),
  "symbol": "BTCUSD",
  "amount":"0.02",
  "price": "0.02",
  "exchange": "bitfinex",
  "side": "buy",
  "type": "exchange limit"
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/order/cancel/replace",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
})
```

> **Response**

```json
{
  "id":448411365,
  "symbol":"btcusd",
  "exchange":"bitfinex",
  "price":"0.02",
  "avg_execution_price":"0.0",
  "side":"buy",
  "type":"exchange limit",
  "timestamp":"1444276597.691580782",
  "is_live":true,
  "is_cancelled":false,
  "is_hidden":false,
  "was_forced":false,
  "original_amount":"0.02",
  "remaining_amount":"0.02",
  "executed_amount":"0.0",
  "order_id":448411365
}
```

**Endpoint**

`/order/cancel/replace`

**Description**

Replace an orders with a new one.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_id</strong></td>
              <td>[int]</td>
              <td>The order ID (to be replaced) given by `/order/new`.</td>
            </tr>
            <tr>
              <td><strong>symbol</strong></td>
              <td>[string]</td>
              <td>The name of the symbol (see `/symbols`).</td>
            </tr>
            <tr>
              <td><strong>amount</strong></td>
              <td>[decimal]</td>
              <td>Order size: how much to buy or sell.</td>
            </tr>
            <tr>
              <td><strong>price</strong></td>
              <td>[price]</td>
              <td>Price to buy or sell at. May omit if a market order.</td>
            </tr>
            <tr>
              <td><strong>exchange</strong></td>
              <td>[string]</td>
              <td>"bitfinex", "bitstamp", "all" (for no routing).</td>
            </tr>
            <tr>
              <td><strong>side</strong></td>
              <td>[string]</td>
              <td>Either "buy" or "sell".</td>
            </tr>
            <tr>
              <td><strong>type</strong></td>
              <td>[string]</td>
              <td>Either "market" / "limit" / "stop" / "trailing-stop" / "fill-or-kill" / "exchange market" / "exchange limit" / "exchange stop" / "exchange trailing-stop" / "exchange fill-or-kill". (type starting by "exchange " are exchange orders, others are margin trading orders)</td>
            </tr>
            <tr>
              <td><strong>is_hidden</strong></td>
              <td>[bool]</td>
              <td>true if the order should be hidden. Default is false.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_id</strong></td>
              <td>[int]</td>
              <td>A randomly generated ID for the order and the information given by /order/status.</td>
            </tr>
            </tbody>
            </table>

#### Order status

> **Request**

```javascript
var payload = {
  "order_id": 448411153,
  "request": "/v1/order/status",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/order/status",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":448411153,
  "symbol":"btcusd",
  "exchange":null,
  "price":"0.01",
  "avg_execution_price":"0.0",
  "side":"buy",
  "type":"exchange limit",
  "timestamp":"1444276570.0",
  "is_live":false,
  "is_cancelled":true,
  "is_hidden":false,
  "was_forced":false,
  "original_amount":"0.01",
  "remaining_amount":"0.01",
  "executed_amount":"0.0"
}
```

**Endpoint**

`/order/status`

**Description**

Get the status of an order. Is it active? Was it cancelled? To what extent has it been executed? etc.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>order_id</strong></td>
              <td>[int]</td>
              <td>The order ID given by `/order/new`</td>
            </tr>
            </tbody>
            </table>

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>symbol</strong></td>
              <td>[string]</td>
              <td>The symbol name the order belongs to.</td>
            </tr>
            <tr>
              <td><strong>exchange</strong></td>
              <td>[string]</td>
              <td>"bitfinex", "bitstamp".</td>
            </tr>
            <tr>
              <td><strong>price</strong></td>
              <td>[decimal]</td>
              <td>The price the order was issued at (can be null for market orders).</td>
            </tr>
            <tr>
              <td><strong>avg_execution_price</strong></td>
              <td>[decimal]</td>
              <td>The average price at which this order as been executed so far. 0 if the order has not been executed at all.</td>
            </tr>
            <tr>
              <td><strong>side</strong></td>
              <td>[string]</td>
              <td>Either "buy" or "sell".</td>
            </tr>
            <tr>
              <td><strong>type</strong></td>
              <td>[string]</td>
              <td>Either "market" / "limit" / "stop" / "trailing-stop".</td>
            </tr>
            <tr>
              <td><strong>timestamp</strong></td>
              <td>[time]</td>
              <td>The timestamp the order was submitted.</td>
            </tr>
            <tr>
              <td><strong>is_live</strong></td>
              <td>[bool]</td>
              <td>Could the order still be filled?</td>
            </tr>
            <tr>
              <td><strong>is_cancelled</strong></td>
              <td>[bool]</td>
              <td>Has the order been cancelled?</td>
            </tr>
            <tr>
              <td><strong>is_hidden</strong></td>
              <td>[bool]</td>
              <td>Is the order hidden?</td>
            </tr>
            <tr>
              <td><strong>was_forced</strong></td>
              <td>[bool]</td>
              <td>For margin only true if it was forced by the system.</td>
            </tr>
            <tr>
              <td><strong>executed_amount</strong></td>
              <td>[decimal]</td>
              <td>How much of the order has been executed so far in its history?</td>
            </tr>
            <tr>
              <td><strong>remaining_amount</strong></td>
              <td>[decimal]</td>
              <td>How much is still remaining to be submitted?</td>
            </tr>
            <tr>
              <td><strong>original_amount</strong></td>
              <td>[decimal]</td>
              <td>What was the order originally submitted for?</td>
            </tr>

            </tbody>
            </table>

#### Active orders

> **Request**

```javascript
var payload = {
  "request": "/v1/orders",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/orders",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "id":448411365,
  "symbol":"btcusd",
  "exchange":"bitfinex",
  "price":"0.02",
  "avg_execution_price":"0.0",
  "side":"buy",
  "type":"exchange limit",
  "timestamp":"1444276597.0",
  "is_live":true,
  "is_cancelled":false,
  "is_hidden":false,
  "was_forced":false,
  "original_amount":"0.02",
  "remaining_amount":"0.02",
  "executed_amount":"0.0"
}]
```

**Endpoint**

`/orders`

**Description**

View your active orders.

**Response Details**

An array of the results of `/order/status` for all your live orders.

### Positions

#### Active Positions

> **Request**

```javascript
var payload = {
  "request": "/v1/positions",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/positions",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "id":943715,
  "symbol":"btcusd",
  "status":"ACTIVE",
  "base":"246.94",
  "amount":"1.0",
  "timestamp":"1444141857.0",
  "swap":"0.0",
  "pl":"-2.22042"
}]
```

**Endpoint**

`/positions`

**Description**

View your active positions.

**Response Details**

An array of your active positions.


#### Claim position

> **Request**

```javascript
var payload = {
  "request": "/v1/position/claim",
  "nonce": Date.now().toString(),
  "position_id": 943715
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/position/claim",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":943715,
  "symbol":"btcusd",
  "status":"ACTIVE",
  "base":"246.94",
  "amount":"1.0",
  "timestamp":"1444141857.0",
  "swap":"0.0",
  "pl":"-2.2304"
}
```

**Endpoint**

`/position/claim`

**Description**

A position can be claimed if:

It is a long position: The amount in the last unit of the position pair that you have in your trading wallet
AND/OR the realized profit of the position is greater or equal to the purchase amount of the position
(base price * position amount) and the funds which need to be returned. For example, for a long BTCUSD position,
you can claim the position if the amount of USD you have in the trading wallet is greater than the base price * the
position amount and the funds used.

It is a short position: The amount in the first unit of the position pair that you have in your trading wallet is
greater or equal to the amount of the position and the margin funding used.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>position_id</strong></td>
              <td>[int]</td>
              <td>The position ID given by `/positions`.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

Status of the position for the claimed position, if the position could be claimed.

### Historical Data

#### Balance History

> **Request**

```javascript
var payload = {
  "request": "/v1/history",
  "nonce": Date.now().toString(),
  "currency": "USD",
  "limit": 1
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/history",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "currency":"USD",
  "amount":"-246.94",
  "balance":"515.4476526",
  "description":"Position claimed @ 245.2 on wallet trading",
  "timestamp":"1444277602.0"
}]
```

**Endpoint**

`/history`

**Description**

View all of your balance ledger entries.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>currency</strong></td>
            <td>[string]</td>
            <td>The currency to look for.</td>
          </tr>
          <tr>
            <td><strong>since</strong></td>
            <td>[time]</td>
            <td>Optional. Return only the history after this timestamp.</td>
          </tr>
          <tr>
            <td><strong>until</strong></td>
            <td>[time]</td>
            <td>Optional. Return only the history before this timestamp.</td>
          </tr>
          <tr>
            <td><strong>limit</strong></td>
            <td>[int]</td>
            <td>Optional. Limit the number of entries to return. Default is 500.</td>
          </tr>
          <tr>
            <td><strong>wallet</strong></td>
            <td>[string]</td>
            <td>Optional. Return only entries that took place in this wallet. Accepted inputs are: "trading", "exchange", "deposit".</td>
          </tr>
          </tbody>
          </table>

**Response Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>currency</strong></td>
            <td>[string]</td>
            <td>Currency</td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td>Positive (credit) or negative (debit)</td>
          </tr>
          <tr>
            <td><strong>balance</strong></td>
            <td>[decimal]</td>
            <td>Wallet balance after the current entry</td>
          </tr>
          <tr>
            <td><strong>description</strong></td>
            <td>[string]</td>
            <td>Description of the entry. Includes the wallet in which the operation took place</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td>Timestamp of the entry</td>
          </tr>

          </tbody>
          </table>

#### Deposit-Withdrawal History

> **Request**

```javascript
var payload = {
  "request": "/v1/history/movements",
  "nonce": Date.now().toString(),
  "currency": "BTC",
  "limit": 1
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/history/movements",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "id":581183,
  "currency":"BTC",
  "method":"BITCOIN",
  "type":"WITHDRAWAL",
  "amount":".01",
  "description":"3QXYWgRGX2BPYBpUDBssGbeWEa5zq6snBZ, offchain transfer ",
  "status":"COMPLETED",
  "timestamp":"1443833327.0"
}]
```

**Endpoint**

`/history/movements`

**Description**

View your past deposits/withdrawals.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>currency</strong></td>
            <td>[string]</td>
            <td>The currency to look for.</td>
          </tr>
          <tr>
            <td><strong>method</strong></td>
            <td>[string]</td>
            <td>Optional. The method of the deposit/withdrawal (can be "bitcoin", "litecoin", "darkcoin", "wire").</td>
          </tr>
          <tr>
            <td><strong>since</strong></td>
            <td>[time]</td>
            <td>Optional. Return only the history after this timestamp.</td>
          </tr>
          <tr>
            <td><strong>until</strong></td>
            <td>[time]</td>
            <td>Optional. Return only the history before this timestamp.</td>
          </tr>
          <tr>
            <td><strong>limit</strong></td>
            <td>[int]</td>
            <td>Optional. Limit the number of entries to return. Default is 500.</td>
          </tr>
          </tbody>
          </table>

**Response Details**

An array of histories

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>currency</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>method</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>type</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td>Absolute value of the movement</td>
          </tr>
          <tr>
            <td><strong>description</strong></td>
            <td>[string]</td>
            <td>Description of the movement (txid, destination address,,,,)</td>
          </tr>
          <tr>
            <td><strong>status</strong></td>
            <td>[string]</td>
            <td>Status of the movement</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td>Timestamp of the movement</td>
          </tr>

          </tbody>
          </table>

#### Past Trades

> **Request**

```javascript
var payload = {
  "request": "/v1/mytrades",
  "nonce": Date.now().toString(),
  "symbol": "BTCUSD",
  "limit_trades": 1
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/mytrades",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "price":"246.94",
  "amount":"1.0",
  "timestamp":"1444141857.0",
  "exchange":"",
  "type":"Buy",
  "fee_currency":"USD",
  "fee_amount":"-0.49388",
  "tid":11970839,
  "order_id":446913929
}]
```

**Endpoint**

`/mytrades`

**Description**

View your past trades.

**Request Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>symbol</strong></td>
            <td>[string]</td>
            <td>The pair traded (BTCUSD, LTCUSD, LTCBTC).</td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td>Trades made before this timestamp won't be returned.</td>
          </tr>
          <tr>
            <td><strong>until</strong></td>
            <td>[time]</td>
            <td>Optional. Trades made after this timestamp won't be returned.</td>
          </tr>
          <tr>
            <td><strong>limit_trades</strong></td>
            <td>[int]</td>
            <td>Optional. Limit the number of trades returned. Default is 50.</td>
          </tr>
          <tr>
            <td><strong>reverse</strong></td>
            <td>[int]</td>
            <td>Optional. Return trades in reverse order (the oldest comes first). Default is returning newest trades first.</td>
          </tr>
          </tbody>
          </table>

**Response Details**

An array of trades

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>price</strong></td>
            <td>[price]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>timestamp</strong></td>
            <td>[time]</td>
            <td>return only trades after or at the time specified here</td>
          </tr>
          <tr>
            <td><strong>until</strong></td>
            <td>[time]</td>
            <td>return only trades before or a the time specified here</td>
          </tr>
          <tr>
            <td><strong>exchange</strong></td>
            <td>[string]</td>
            <td></td>
          </tr>
          <tr>
            <td><strong>type</strong></td>
            <td>[string]</td>
            <td>Sell or Buy</td>
          </tr>
          <tr>
            <td><strong>fee_currency</strong></td>
            <td>[string]</td>
            <td>Currency you paid this trade's fee in</td>
          </tr>
          <tr>
            <td><strong>fee_amount</strong></td>
            <td>[decimal]</td>
            <td>Amount of fees you paid for this trade</td>
          </tr>
          <tr>
            <td><strong>tid</strong></td>
            <td>[integer]</td>
            <td>unique identification number of the trade</td>
          </tr>
          <tr>
            <td><strong>order_id</strong></td>
            <td>[integer]</td>
            <td>unique identification number of the parent order of the trade</td>
          </tr>

          </tbody>
          </table>

### Margin Funding

#### New Offer
> **Request**

```javascript
var payload = {
  "request": "/v1/offer/new",
  "nonce": Date.now().toString(),
  "currency": "USD",
  "amount": "50.00",
  "rate": "20",
  "period": 2,
  "direction": "lend"
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/offer/new",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":13800585,
  "currency":"USD",
  "rate":"20.0",
  "period":2,
  "direction":"lend",
  "timestamp":"1444279698.21175971",
  "is_live":true,
  "is_cancelled":false,
  "original_amount":"50.0",
  "remaining_amount":"50.0",
  "executed_amount":"0.0",
  "offer_id":13800585
}
```

**Endpoint**

`/offer/new`

**Description**

Submit a new offer.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>currency</strong></td>
              <td>[string]</td>
              <td>The name of the currency.</td>
            </tr>
            <tr>
              <td><strong>amount</strong></td>
              <td>[decimal]</td>
              <td>Offer size: how much to lend or borrow.</td>
            </tr>
            <tr>
              <td><strong>rate</strong></td>
              <td>[decimal]</td>
              <td>Rate to lend or borrow at. <b>In percentage per 365 days</b>.</td>
            </tr>
            <tr>
              <td><strong>period</strong></td>
              <td>[integer]</td>
              <td>Number of days of the funding contract (in days)</td>
            </tr>
            <tr>
              <td><strong>direction</strong></td>
              <td>[string]</td>
              <td>Either "lend" or "loan".</td>
            </tr>
            </tbody>
            </table>

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>offer_id</strong></td>
              <td>[int]</td>
              <td>A randomly generated ID for the offer and the information given by /offer/status</td>
            </tr>
            </tbody>
            </table>

#### Cancel Offer
> **Request**

```javascript
var payload = {
  "request": "/v1/offer/cancel",
  "nonce": Date.now().toString(),
  "offer_id": 13800585
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/offer/cancel",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
    console.log(body);
});
```

> **Response**

```json
{
  "id":13800585,
  "currency":"USD",
  "rate":"20.0",
  "period":2,
  "direction":"lend",
  "timestamp":"1444279698.0",
  "is_live":true,
  "is_cancelled":false,
  "original_amount":"50.0",
  "remaining_amount":"50.0",
  "executed_amount":"0.0"
}
```

**Endpoint**

`/offer/cancel`

**Description**

Cancel an offer.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>offer_id</strong></td>
              <td>[int]</td>
              <td>The offer ID given by `/offer/new`.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

Result of /offer/status for the cancelled offer.

#### Offer Status
> **Request**

```javascript
var payload = {
  "request": "/v1/offer/status",
  "nonce": Date.now().toString(),
  "offer_id": 13800585
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/offer/status",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":13800585,
  "currency":"USD",
  "rate":"20.0",
  "period":2,
  "direction":"lend",
  "timestamp":"1444279698.0",
  "is_live":false,
  "is_cancelled":true,
  "original_amount":"50.0",
  "remaining_amount":"50.0",
  "executed_amount":"0.0"
}
```

**Endpoint**

`/offer/status`

**Description**

Get the status of an offer. Is it active? Was it cancelled? To what extent has it been executed? etc.

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>offer_id</strong></td>
              <td>[int]</td>
              <td>The offer ID given by `/offer/new`.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>currency</strong></td>
              <td>[string]</td>
              <td>The currency name of the offer.</td>
            </tr>
            <tr>
              <td><strong>rate</strong></td>
              <td>[decimal]</td>
              <td>The rate the offer was issued at (in % per 365 days).</td>
            </tr>
            <tr>
              <td><strong>period</strong></td>
              <td>[integer]</td>
              <td>The number of days of the offer.</td>
            </tr>
            <tr>
              <td><strong>direction</strong></td>
              <td>[string]</td>
              <td>Either "lend" or "loan".</td>
            </tr>
            <tr>
              <td><strong>type</strong></td>
              <td>[string]</td>
              <td>Either "market" / "limit" / "stop" / "trailing-stop".</td>
            </tr>
            <tr>
              <td><strong>timestamp</strong></td>
              <td>[time]</td>
              <td>The timestamp the offer was submitted.</td>
            </tr>
            <tr>
              <td><strong>is_live</strong></td>
              <td>[bool]</td>
              <td>Could the offer still be filled?</td>
            </tr>
            <tr>
              <td><strong>is_cancelled</strong></td>
              <td>[bool]</td>
              <td>Has the offer been cancelled?</td>
            </tr>
            <tr>
              <td><strong>executed_amount</strong></td>
              <td>[decimal]</td>
              <td>How much of the offer has been executed so far in its history?</td>
            </tr>
            <tr>
              <td><strong>remaining_amount</strong></td>
              <td>[decimal]</td>
              <td>How much is still remaining to be submitted?</td>
            </tr>
            <tr>
              <td><strong>original_amount</strong></td>
              <td>[decimal]</td>
              <td>What was the offer originally submitted for?</td>
            </tr>

            </tbody>
            </table>

#### Active Credits

> **Request**

```javascript
var payload = {
  "request": "/v1/offers",
  "nonce": Date.now().toString(),
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/offers",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "id":13800719,
  "currency":"USD",
  "rate":"31.39",
  "period":2,
  "direction":"lend",
  "timestamp":"1444280237.0",
  "is_live":true,
  "is_cancelled":false,
  "original_amount":"50.0",
  "remaining_amount":"50.0",
  "executed_amount":"0.0"
}]
```

**Endpoint**

`/offers`

**Description**

View your active offers.

**Response Details**

An array of the results of `/offer/status` for all your live offers (lending or borrowing).

#### Active funding used in a margin position

> **Request**

```javascript
var payload = {
  "request": "/v1/taken_funds",
  "nonce": Date.now().toString(),
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/taken_funds",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "id":11576737,
  "position_id":944309,
  "currency":"USD",
  "rate":"9.8874",
  "period":2,
  "amount":"34.24603414",
  "timestamp":"1444280948.0"
}]
```

**Endpoint**

`/taken_funds`

**Description**

View your funding currently borrowed and used in a margin position.

**Response Details**

An array of your active margin funds.


#### Total taken funds

> **Request**

```javascript
var payload = {
  "request": "/v1/total_taken_funds",
  "nonce": Date.now().toString(),
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/total_taken_funds",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "position_pair":"BTCUSD",
  "total_swaps":"34.24603414"
}]
```

**Endpoint**

`/total_taken_funds`

**Description**

View the total of your active funding used in your position(s).

**Response Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>position_pair</strong></td>
              <td>[string]</td>
              <td>Pair of the position</td>
            </tr>
            <tr>
              <td><strong>total_swaps</strong></td>
              <td>[decimal]</td>
              <td>Sum of the active funding backing this position</td>
            </tr>
            </tbody>
            </table>

**Response Details**

##### Close margin funding

> **Request**

```javascript
var payload = {
  "request": "/v1/funding/close",
  "nonce": Date.now().toString(),
  "swap_id": 11576737
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/funding/close",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
{
  "id":11576737,
  "position_id":944309,
  "currency":"USD",
  "rate":"9.8874",
  "period":2,
  "amount":"34.24603414",
  "timestamp":"1444280948.0"
}
```

**Endpoint**

`/funding/close`

**Description**

Return the funding taken in a margin position

**Request Details**

<table class="striped">
            <thead>
              <tr>
                <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
                <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>swap_id</strong></td>
              <td>[int]</td>
              <td>The ID given by `/taken_funds`.</td>
            </tr>
            </tbody>
            </table>

**Response Details**

Status of the margin funding contract. Closed if it could be closed.

### Wallet Balances

> **Request**

```javascript
var payload = {
  "request": "/v1/balances",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/balances",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "type":"deposit",
  "currency":"btc",
  "amount":"0.0",
  "available":"0.0"
},{
  "type":"deposit",
  "currency":"usd",
  "amount":"1.0",
  "available":"1.0"
},{
  "type":"exchange",
  "currency":"btc",
  "amount":"1",
  "available":"1"
},{
  "type":"exchange",
  "currency":"usd",
  "amount":"1",
  "available":"1"
},{
  "type":"trading",
  "currency":"btc",
  "amount":"1",
  "available":"1"
},{
  "type":"trading",
  "currency":"usd",
  "amount":"1",
  "available":"1"
}]
```

**Endpoint**

`/balances`

**Description**

See your balances.

**Response Details**

An array of wallet balances

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>type</strong></td>
            <td>[string]</td>
            <td>"trading", "deposit" or "exchange".</td>
          </tr>
          <tr>
            <td><strong>currency</strong></td>
            <td>[string]</td>
            <td>Currency </td>
          </tr>
          <tr>
            <td><strong>amount</strong></td>
            <td>[decimal]</td>
            <td>How much balance of this currency in this wallet</td>
          </tr>
          <tr>
            <td><strong>available</strong></td>
            <td>[decimal]</td>
            <td>How much X there is in this wallet that is available to trade.</td>
          </tr>
          </tbody>
          </table>

### Margin Information

> **Request**

```javascript
var payload = {
  "request": "/v1/margin_infos",
  "nonce": Date.now().toString()
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/margin_infos",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "margin_balance":"14.80039951",
  "tradable_balance":"-12.50620089",
  "unrealized_pl":"-0.18392",
  "unrealized_swap":"-0.00038653",
  "net_value":"14.61609298",
  "required_margin":"7.3569",
  "leverage":"2.5",
  "margin_requirement":"13.0",
  "margin_limits":[{
    "on_pair":"BTCUSD",
    "initial_margin":"30.0",
    "margin_requirement":"15.0",
    "tradable_balance":"-0.329243259666666667"
  }],
  "message": "Margin requirement, leverage and tradable balance are now per pair. You will find them under margin_limits, for each pair. Please update your code as soon as possible."
}]
```

**Endpoint**

`/margin_infos`

**Description**

See your trading wallet information for margin trading.

**Response Details**

<table class="striped">
          <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
          </thead>
          <tbody>

          <tr>
            <td><strong>margin_balance</strong></td>
            <td>[decimal]</td>
            <td>the USD value of all your trading assets (based on last prices)</td>
          </tr>
          <tr>
            <td><strong>unrealized_pl</strong></td>
            <td>[decimal]</td>
            <td>The unrealized profit/loss of all your open positions</td>
          </tr>
          <tr>
            <td><strong>unrealized_swap</strong></td>
            <td>[decimal]</td>
            <td>The margin funding used by all your open positions</td>
          </tr>
          <tr>
            <td><strong>net_value</strong></td>
            <td>[decimal]</td>
            <td>Your net value (the USD value of your trading wallet, including your margin balance, your unrealized P/L and margin funding)</td>
          </tr>
          <tr>
            <td><strong>required_margin</strong></td>
            <td>[decimal]</td>
            <td>The minimum net value to maintain in your trading wallet, under which all of your positions are fully liquidated</td>
          </tr>
          <tr>
            <td><strong>margin_limits</strong></td>
            <td>[array]</td>
            <td>The list of margin limits for each pair. The array gives you the following information, for each pair:</td>
          </tr>
          <tr>
            <td><strong>on_pair</strong></td>
            <td>[string]</td>
            <td>The pair for which these limits are valid</td>
          </tr>
          <tr>
            <td><strong>initial_margin</strong></td>
            <td>[decimal]</td>
            <td>The minimum margin (in %) to maintain to open or increase a position</td>
          </tr>
          <tr>
            <td><strong>tradable_balance</strong></td>
            <td>[decimal]</td>
            <td>Your tradable balance in USD (the maximum size you can open on leverage for this pair)</td>
          </tr>
          <tr>
            <td><strong>margin_requirements</strong></td>
            <td>[decimal]</td>
            <td>The maintenance margin (% of the USD value of all of your open positions in the current pair to maintain)</td>
          </tr>

          </tbody>
          </table>

### Transfer Between Wallets

> **Request**

```javascript
var payload = {
  "request": "/v1/transfer",
  "nonce": Date.now().toString(),
  "amount": "1.0",
  "currency": "USD",
  "walletfrom": "exchange",
  "walletto": "deposit"
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/transfer",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "status":"success",
  "message":"1.0 USD transfered from Exchange to Deposit"
}]
```

**Endpoint**

`/transfer`

**Description**

Allow you to move available balances between your wallets.

**Request Details**

<table class="striped">
            <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>amount</strong></td>
              <td>[decimal]</td>
              <td>Amount to transfer.</td>
            </tr>
            <tr>
              <td><strong>currency</strong></td>
              <td>[string]</td>
              <td>Currency of funds to transfer.</td>
            </tr>
            <tr>
              <td><strong>walletfrom</strong></td>
              <td>[string]</td>
              <td>Wallet to transfer from.</td>
            </tr>
            <tr>
              <td><strong>walletto</strong></td>
              <td>[string]</td>
              <td>Wallet to transfer to.</td>
            </tr>
            </tbody>
          </table>

**Response Details**

<table class="striped">
            <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>status</strong></td>
              <td>[string]</td>
              <td>"success" or "error".</td>
            </tr>
            <tr>
              <td><strong>message</strong></td>
              <td>[string]</td>
              <td>Success or error message</td>
            </tr>
            </tbody>
          </table>

### Withdrawal

> **Request**

```javascript
var payload = {
  "request": "/v1/withdraw",
  "nonce": Date.now().toString(),
  "amount": "0.01",
  "withdraw_type": "bitcoin",
  "walletselected": "exchange",
  "address": "1DKwqRhDmVyHJDL4FUYpDmQMYA3Rsxtvur"
};
payload = new Buffer(JSON.stringify(payload)).toString('base64');
var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
var options = {
  url: "/withdraw",
  headers: {
    'X-BFX-PAYLOAD': payload,
    'X-BFX-SIGNATURE': signature
  },
  body: payload
};
baseRequest.post(options, function(error, response, body) {
  console.log(body);
});
```

> **Response**

```json
[{
  "status":"success",
  "message":"Your withdrawal request has been successfully submitted.",
  "withdrawal_id":586829
}]
```

**Endpoint**

`/withdraw`

**Description**

Allow you to request a withdrawal from one of your wallet.

**Request Details**

<table class="striped">
            <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>withdraw_type</strong></td>
              <td>[string]</td>
              <td>can be "bitcoin", "litecoin" or "darkcoin"  or "tether" or "wire".</td>
            </tr>
            <tr>
              <td><strong>walletselected</strong></td>
              <td>[string]</td>
              <td>The wallet to withdraw from, can be "trading", "exchange", or "deposit".</td>
            </tr>
            <tr>
              <td><strong>amount</strong></td>
              <td>[string]</td>
              <td>Amount to withdraw.</td>
            </tr>
            <tr>
              <td colspan="3"><strong>For cryptocurrencies withdrawals (including "tether")</strong></td>
            </tr>
            <tr>
              <td><strong>address</strong></td>
              <td>[string]</td>
              <td>Destination address for withdrawal.</td>
            </tr>
            <tr>
              <td colspan="3"><strong>For wire withdrawals</strong></td>
            </tr>
            <tr>
              <td><strong>expressWire</strong></td>
              <td>[int]</td>
              <td>Optional. "1" to submit an express wire withdrawal, "0" or omit for a normal withdrawal</td>
            </tr>
            <tr>
              <td><strong>account_name</strong></td>
              <td>[string]</td>
              <td>Account name</td>
            </tr>
            <tr>
              <td><strong>account_number</strong></td>
              <td>[string]</td>
              <td>Account number</td>
            </tr>
            <tr>
              <td><strong>bank_name</strong></td>
              <td>[string]</td>
              <td>Bank name</td>
            </tr>
            <tr>
              <td><strong>bank_address</strong></td>
              <td>[string]</td>
              <td>Bank address</td>
            </tr>
            <tr>
              <td><strong>bank_city</strong></td>
              <td>[string]</td>
              <td>Bank city</td>
            </tr>
            <tr>
              <td><strong>bank_country</strong></td>
              <td>[string]</td>
              <td>Bank country</td>
            </tr>
            <tr>
              <td><strong>detail_payment</strong></td>
              <td>[string]</td>
              <td>Optional. Message to beneficiary</td>
            </tr>
            <tr>
              <td><strong>intermediary_bank_name</strong></td>
              <td>[string]</td>
              <td>Optional. Intermediary bank name</td>
            </tr>
            <tr>
              <td><strong>intermediary_bank_address</strong></td>
              <td>[string]</td>
              <td>Optional. Intermediary bank address</td>
            </tr>
            <tr>
              <td><strong>intermediary_bank_city</strong></td>
              <td>[string]</td>
              <td>Optional. Intermediary bank city</td>
            </tr>
            <tr>
              <td><strong>intermediary_bank_country</strong></td>
              <td>[string]</td>
              <td>Optional. Intermediary bank country</td>
            </tr>
            <tr>
              <td><strong>intermediary_bank_account</strong></td>
              <td>[string]</td>
              <td>Optional. Intermediary bank account</td>
            </tr>
            <tr>
              <td><strong>intermediary_bank_swift</strong></td>
              <td>[string]</td>
              <td>Optional. Intermediary bank SWIFT</td>
            </tr>
            </tbody>
          </table>

**Request Details**

<table class="striped">
            <thead>
            <tr>
              <th class="sortable">Key<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Type<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
              <th class="sortable">Description<i class="fa fa-sort-down"></i><i class="fa fa-sort-up"></i></th>
            </tr>
            </thead>
            <tbody>

            <tr>
              <td><strong>status</strong></td>
              <td>[string]</td>
              <td>"success" or "error".</td>
            </tr>
            <tr>
              <td><strong>message</strong></td>
              <td>[string]</td>
              <td>Success or error message</td>
            </tr>
            <tr>
              <td><strong>withdrawal_id</strong></td>
              <td>[int]</td>
              <td>ID of the withdrawal (0 if unsuccessful)</td>
            </tr>
            </tbody>
          </table>
