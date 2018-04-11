'use strict'

const models = {
  OrderBook: require('./order_book'),
  BalanceInfo: require('./balance_info'),
  FundingCredit: require('./funding_credit'),
  FundingInfo: require('./funding_info'),
  FundingLoan: require('./funding_loan'),
  FundingOffer: require('./funding_offer'),
  FundingTrade: require('./funding_trade'),
  MarginInfo: require('./margin_info'),
  Notification: require('./notification'),
  Order: require('./order'),
  Position: require('./position'),
  Trade: require('./trade'),
  Wallet: require('./wallet'),
  Alert: require('./alert'),
  TradeTicker: require('./trade_ticker'),
  FundingTicker: require('./funding_ticker'),
  Ticker: require('./ticker'),
  PublicTrade: require('./public_trade'),
  Candle: require('./candle')
}

module.exports = models
