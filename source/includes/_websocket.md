# Websocket

## General

### Current Version
Bitfinex Websocket API current version is 1.0

### SSL Websocket Connection
URI: `wss://api2.bitfinex.com:3000/ws`

### Message encoding
Each message sent and received via the Bitfinex's websocket channel is encoded in JSON format

### Public Channels
* **Book:** order book feed (BTCUSD, LTCUSD, LTCBTC)
* **Ticker:** ticker feed (BTCUSD, LTCUSD, LTCBTC)
* **Trades:** trades feed (BTCUSD, LTCUSD, LTCBTC)

### Authenticated Channels
* **Account Info:** account specific private data (positions, orders, executed trades, balances)
