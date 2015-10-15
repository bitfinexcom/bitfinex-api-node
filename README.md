Bitfinex API Node Reference Library
=========

A Node.js reference implementation of the Bitfinex API

## Installation
```
  npm install bitfinex-api-node
```
## Usage
```javascript
  bitfinex-api-node = require('bitfinex-api-node')
  bitfinex-websocket = bitfinex-api-node.websocket()
  bitfinex-rest = bitfinex-api-node.rest();

  console.log('bitfinex-api-node', bitfinex-api-node, 'bitfinex-websocket', bitfinex-websocket, 'bitfinex-rest', bitfinex-rest);
```

### Functions
Unless otherwise stated, all subscription functions have a default value of 'BTCUSD'.
#### subTrades
Usage:
```javascript
bitfinex-websocket.subTrades()
```
This allows you to subscribe to the trade channel. It stores the Trades in the trades attribute of the object.
```javascript
bitfinex-websocket.trades
```
#### subTicker
Usage:
```javascript
bitfinex-websocket.subTicker()
```
This allows you to subscribe to the ticker channel. It stores the Trades in the trades attribute of the object.
```javascript
bitfinex-websocket.tickers
```
#### subBook
Usage:
```javascript
bitfinex-websocket.subBook()
```
This allows you to subscribe to the book channel. It stores the Trades in the trades attribute of the object.
```javascript
bitfinex-websocket.books
```
#### auth
Usage:
```javascript
bitfinex-websocket.auth()
```
This allows you to subscribe to the account info channel.
#### Helpers
mapping: shows you the ChanId's and their corresponding names in the format PAIR_channel
messages: shows you all the messages you have received if you want to see the first message, it is useful to use bitfinex-websocket.messages.reverse()


## Tests
```
  npm test
```
## Release History
```
* 0.0.1 Initial release
* 0.0.2 Added the subscribe functions
```
