'use strict'

const map = {}

map.ticker = {
  tradingPairs: [
    'BID',
    'BID_SIZE',
    'ASK',
    'ASK_SIZE',
    'DAILY_CHANGE',
    'DAILY_CHANGE_PERC',
    'LAST_PRICE',
    'VOLUME',
    'HIGH',
    'LOW'
  ],

  // on funding currencies (ex. fUSD)
  fundingCurrencies: [
    'FRR',
    'BID',
    'BID_SIZE',
    'BID_PERIOD',
    'ASK',
    'ASK_SIZE',
    'ASK_PERIOD',
    'DAILY_CHANGE',
    'DAILY_CHANGE_PERC',
    'LAST_PRICE',
    'VOLUME',
    'HIGH',
    'LOW'
  ]
}

map.trades = {
  // on trading pairs (ex. tBTCUSD)
  tradingPairs: [
    'ID',
    'MTS',
    'AMOUNT',
    'PRICE'
  ],

  // on funding currencies (ex. fUSD)
  fundingCurrencies: [
    'ID',
    'MTS',
    'AMOUNT',
    'RATE',
    'PERIOD'
  ]
}

map.orderbook = {
  // on trading pairs (ex. tBTCUSD)
  tradingPairs: [
    'PRICE',
    'COUNT',
    'AMOUNT'
  ],

  // on funding currencies (ex. fUSD)
  fundingCurrencies: [
    'RATE',
    'PERIOD',
    'COUNT',
    'AMOUNT'
  ]
}

map.orderbookRaw = {
  // on trading pairs (ex. tBTCUSD)
  tradingPairs: [
    'ORDER_ID',
    'PRICE',
    'AMOUNT'
  ],

  // on funding currencies (ex. fUSD)
  fundingCurrencies: [
    'OFFER_ID',
    'RATE',
    'PERIOD',
    'AMOUNT'
  ]
}

map.candles = {

  tradingPairs: [
    'MTS',
    'OPEN',
    'CLOSE',
    'HIGH',
    'LOW',
    'VOLUME'
  ]

}

module.exports = map
