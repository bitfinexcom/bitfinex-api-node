'use strict'

const assert = require('assert')
const { FIELDS: TRADING_TICKER_FIELDS } = require('../../lib/models/trading_ticker')
const { FIELDS: FUNDING_TICKER_FIELDS } = require('../../lib/models/funding_ticker')

const TRADING_TICKER = [ // NOTE: no symbol
  25, 0, 105, 0, -149, -0.9933, 1, 473, 150, 1
]

const FUNDING_TICKER = [ // NOTE: no symbol
  0.00063991, 0.000811, 2, 6576537.37384749, 0.00064119, 2, 225522.0501075,
  -0.00056019, -0.4668, 0.00063981, 270141543.39509803, 0.0013, 0.00000224
]

const getTradingTicker = (symbol) => ([
  ...(symbol ? [symbol] : []),
  ...TRADING_TICKER
])

const getFundingTicker = (symbol) => ([
  ...(symbol ? [symbol] : []),
  ...FUNDING_TICKER
])

const auditTradingTicker = (ticker, symbol) => {
  const fieldOffset = symbol ? 1 : 0

  if (symbol) {
    assert.equal(ticker.symbol, symbol)
  }

  Object.keys(TRADING_TICKER_FIELDS).forEach(key => {
    if (key === 'symbol') return

    const i = TRADING_TICKER_FIELDS[key]
    assert.equal(ticker[key], TRADING_TICKER[i - fieldOffset])
  })
}

const auditFundingTicker = (ticker, symbol) => {
  const fieldOffset = symbol ? 1 : 0

  if (symbol) {
    assert.equal(ticker.symbol, symbol)
  }

  Object.keys(FUNDING_TICKER_FIELDS).forEach(key => {
    if (key === 'symbol') return

    const i = FUNDING_TICKER_FIELDS[key]
    assert.equal(ticker[key], FUNDING_TICKER[i - fieldOffset])
  })
}

const auditTicker = (ticker = {}, symbol) => {
  return ((symbol && symbol[0] === 'f') || ticker.frr)
    ? auditFundingTicker(ticker, symbol)
    : auditTradingTicker(ticker, symbol)
}

module.exports = {
  getTradingTicker,
  getFundingTicker,
  auditTradingTicker,
  auditFundingTicker,
  auditTicker
}
