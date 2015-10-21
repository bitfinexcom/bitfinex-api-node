# REST

## General

### URL

```javascript
var url = "https://api.bitfinex.com/v1"
```

`https://api.bitfinex.com/v1`

### Authentication

```javascript
var payload = {
  "request": "/v1/account_infos",
  "nonce": Date.now().toString()
};
```

Authentication is done using an API key and a secret. To generate this pair,
go to the [API Access](https://www.bitfinex.com/account/api) page.
As an example of how to authenticate, we can look at the "account_infos" endpoint.
Take the example payload to the right.

<aside class="warning">
The nonce provided must be strictly increasing.
</aside>