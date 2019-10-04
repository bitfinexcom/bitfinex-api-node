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

