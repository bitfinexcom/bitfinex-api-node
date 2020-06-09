'use strict'

/**
 * Configuration options for a WSv2 client instance.
 *
 * @typedef {object} WSv2~Configuration
 * @property {string} [affCode=''] - affiliate code to be applied to all orders
 * @property {string} [apiKey=''] - API key
 * @property {string} [apiSecret=''] - API secret
 * @property {string} [url='wss://api.bitfinex.com/ws/2'] - ws connection url
 * @property {number} [orderOpBufferDelay] - multi-order op batching timeout
 * @property {boolean} [transform] - if true, packets are converted to models
 * @property {object} [agent] - node agent for ws connection (proxy)
 * @property {boolean} [manageOrderBooks] - enable local OB persistence
 * @property {boolean} [manageCandles] - enable local candle persistence
 * @property {boolean} [seqAudit] - enable sequence numbers & verification
 * @property {boolean} [autoReconnect] - if true, we will reconnect on close
 * @property {number} [reconnectDelay] - optional, defaults to 1000 (ms)
 * @property {object} [reconnectThrottler] - pt to limit reconnect freq
 * @property {number} [packetWDDelay] - watch-dog forced reconnection delay
 */
