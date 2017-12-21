/* eslint-env mocha */
'use strict'

const assert = require('assert')
const RESTv2 = require('../../../lib/transports/rest2')
const { MockRESTv2Server } = require('api-mock-srv')

const getTestREST2 = () => {
  return new RESTv2({
    apiKey: 'dummy',
    apiSecret: 'dummy',
    url: 'http://localhost:9999'
  })
}

  it('trades: fetches expected data', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2()
    srv.setResponse('trades.BTCUSD.0.10.50', [42])

    r.trades('BTCUSD', 0, 10, 50, (err, res) => {
      if (err) return done(err)

      assert.deepEqual(res, [42])
      srv.close().then(done).catch(done)
    })
  })

describe('RESTv2 integration (mock server) tests', () => {
  // [rest2MethodName, finalMockResponseKey, rest2MethodArgs]
  const methods = [
    // public
    ['ticker', 'ticker.BTCUSD', ['BTCUSD']],
    ['tickers', 'tickers', [['tBTCUSD', 'tETHUSD']]],
    ['stats', 'stats.key.context', ['key', 'context']],
    ['candles', 'candles.trade:30m:tBTCUSD.hist', [{ timeframe: '30m', symbol: 'tBTCUSD', section: 'hist' }]],

    // private
    ['alertList', 'alerts.price', ['price']],
    ['alertSet', 'alert_set.type.symbol.price', ['type', 'symbol', 'price']],
    ['alertDelete', 'alert_del.symbol.price', ['symbol', 'price']],
    ['trades', 'trades.BTCUSD.0.10.50', ['BTCUSD', 0, 10, 50]],
    ['wallets', 'wallets'],
    ['activeOrders', 'active_orders'],
    ['orderHistory', 'orders.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['positions'],
    ['fundingOffers', 'f_offers.sym', ['sym']],
    ['fundingOfferHistory', 'f_offer_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['fundingLoans', 'f_loans.sym', ['sym']],
    ['fundingLoanHistory', 'f_loan_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['fundingCredits', 'f_credits.sym', ['sym']],
    ['fundingCreditHistory', 'f_credit_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['fundingTrades', 'f_trade_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['marginInfo', 'margin_info.k', ['k']],
    ['fundingInfo', 'f_info.k', ['k']],
    ['performance'],
    ['calcAvailableBalance', 'calc.sym.dir.rate.type', ['sym', 'dir', 'rate', 'type']]
  ]

  methods.forEach((m) => {
    const name = m[0]
    const dataKey = m[1] || m[0]
    const args = m[2] || []

    it(`${name}: fetches expected data`, (done) => {
      const srv = new MockRESTv2Server({ listen: true })
      const r = getTestREST2()
      srv.setResponse(dataKey, [42])

      args.push((err, res) => {
        if (err) return done(err)

        assert.deepEqual(res, [42])
        srv.close().then(done).catch(done)
      })

      r[name].apply(r, args)
    })
  })
})
