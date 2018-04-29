/* eslint-env mocha */
'use strict'

const assert = require('assert')
const RESTv2 = require('../../../lib/transports/rest2')
const { MockRESTv2Server } = require('bfx-api-mock-srv')
const { getTradingTicker, getFundingTicker, auditTicker } = require('../../helpers/data')

const getTestREST2 = (args = {}) => {
  return new RESTv2({
    apiKey: 'dummy',
    apiSecret: 'dummy',
    url: 'http://localhost:9999',
    ...args
  })
}

const getTestFundingOffer = () => ([
  41215275, 'fUSD', 1524784806000, 1524784806000, 1000, 1000, 'FRRDELTAVAR',
  null, null, 0, 'ACTIVE', null, null, null, 0, 30, 0, 0, null, 0, 0.00207328
])

const getTestFundingLoan = () => ([
  2993678, 'fUSD', -1, 1524786468000, 1524786468000, 200, 0, 'ACTIVE', null,
  null, null, 0.002, 7, 1524786468000, 1524786468000, 0, 0, null, 0, 0.002, 0
])

const getTestFundingCredit = () => ([
  26190108, 'fUSD', -1, 1524846786000, 1524846786000, 32.91281465, 0, 'ACTIVE',
  null, null, null, 0.002, 7, 1524786468000, null, 0, 0, null, 0, 0.002, 0, null
])

const auditTestFundingOffer = (fo = {}) => {
  assert.equal(fo.id, 41215275)
  assert.equal(fo.symbol, 'fUSD')
  assert.equal(fo.mtsCreate, 1524784806000)
  assert.equal(fo.mtsUpdate, 1524784806000)
  assert.equal(fo.amount, 1000)
  assert.equal(fo.amountOrig, 1000)
  assert.equal(fo.type, 'FRRDELTAVAR')
  assert.equal(fo.flags, 0)
  assert.equal(fo.status, 'ACTIVE')
  assert.equal(fo.rate, 0)
  assert.equal(fo.period, 30)
  assert.equal(fo.notify, 0)
  assert.equal(fo.hidden, 0)
  assert.equal(fo.renew, 0)
  assert.equal(fo.rateReal, 0.00207328)
}

const auditTestFundingLoan = (fl = {}) => {
  assert.equal(fl.id, 2993678)
  assert.equal(fl.symbol, 'fUSD')
  assert.equal(fl.side, -1)
  assert.equal(fl.mtsCreate, 1524786468000)
  assert.equal(fl.mtsUpdate, 1524786468000)
  assert.equal(fl.amount, 200)
  assert.equal(fl.flags, 0)
  assert.equal(fl.status, 'ACTIVE')
  assert.equal(fl.rate, 0.002)
  assert.equal(fl.period, 7)
  assert.equal(fl.mtsOpening, 1524786468000)
  assert.equal(fl.mtsLastPayout, 1524786468000)
  assert.equal(fl.notify, 0)
  assert.equal(fl.hidden, 0)
  assert.equal(fl.renew, 0)
  assert.equal(fl.rateReal, 0.002)
  assert.equal(fl.noClose, 0)
}

const auditTestFundingCredit = (fc = {}) => {
  assert.equal(fc.id, 26190108)
  assert.equal(fc.symbol, 'fUSD')
  assert.equal(fc.side, -1)
  assert.equal(fc.mtsCreate, 1524846786000)
  assert.equal(fc.mtsUpdate, 1524846786000)
  assert.equal(fc.amount, 32.91281465)
  assert.equal(fc.flags, 0)
  assert.equal(fc.status, 'ACTIVE')
  assert.equal(fc.rate, 0.002)
  assert.equal(fc.period, 7)
  assert.equal(fc.mtsOpening, 1524786468000)
  assert.equal(fc.mtsLastPayout, null)
  assert.equal(fc.notify, 0)
  assert.equal(fc.hidden, 0)
  assert.equal(fc.renew, 0)
  assert.equal(fc.rateReal, 0.002)
  assert.equal(fc.noClose, 0)
  assert.equal(fc.positionPair, null)
}

describe('RESTv2 integration (mock server) tests', () => {
  // [rest2MethodName, finalMockResponseKey, rest2MethodArgs]
  const methods = [
    // public
    ['ticker', 'ticker.tBTCUSD', ['tBTCUSD']],
    ['tickers', 'tickers', [['tBTCUSD', 'tETHUSD']]],
    ['stats', 'stats.key.context', ['key', 'context']],
    ['candles', 'candles.trade:30m:tBTCUSD.hist', [{ timeframe: '30m', symbol: 'tBTCUSD', section: 'hist' }]],

    // private
    ['alertList', 'alerts.price', ['price']],
    ['alertSet', 'alert_set.type.symbol.price', ['type', 'symbol', 'price']],
    ['alertDelete', 'alert_del.symbol.price', ['symbol', 'price']],
    ['accountTrades', 'trades.BTCUSD.0.10.50.1', ['BTCUSD', 0, 10, 50, 1]],
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
        if (err) {
          return srv.close().then(() => done(err)).catch(done)
        }

        assert.deepEqual(res, [42])
        srv.close().then(done).catch(done)
      })

      r[name].apply(r, args)
    })
  })

  it('correctly parses a mixed tickers response', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('tickers', [
      getTradingTicker('tETHUSD'),
      getFundingTicker('fUSD')
    ])

    r.tickers(['tETHUSD', 'fUSD'], (err, data = []) => {
      if (err) {
        return srv.close().then(() => done(err)).catch(done)
      }

      assert.equal(data.length, 2)

      auditTicker(data[0], 'tETHUSD')
      auditTicker(data[1], 'fUSD')

      srv.close().then(done).catch(done)
    })
  })

  it('correctly parses single trading ticker response', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('ticker.tETHUSD', getTradingTicker())

    r.ticker('tETHUSD', (err, ticker = {}) => {
      if (err) {
        return srv.close().then(() => done(err)).catch(done)
      }

      auditTicker(ticker, 'tETHUSD')
      srv.close().then(done).catch(done)
    })
  })

  it('correctly parses single funding ticker response', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('ticker.fUSD', getFundingTicker())

    r.ticker('fUSD', (err, ticker = {}) => {
      if (err) {
        return srv.close().then(() => done(err)).catch(done)
      }

      auditTicker(ticker, 'fUSD')
      srv.close().then(done).catch(done)
    })
  })

  it('correctly parses funding offer response', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_offers.fUSD', [getTestFundingOffer()])

    r.fundingOffers('fUSD').then(([fo]) => {
      auditTestFundingOffer(fo)
      return srv.close()
    }).then(done).catch(done)
  })

  it('correctly parses funding loan response', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_loans.fUSD', [getTestFundingLoan()])

    r.fundingLoans('fUSD').then(([fo]) => {
      auditTestFundingLoan(fo)
      return srv.close()
    }).then(done).catch(done)
  })

  it('correctly parses funding credit response', (done) => {
    const srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_credits.fUSD', [getTestFundingCredit()])

    r.fundingCredits('fUSD').then(([fc]) => {
      auditTestFundingCredit(fc)
      return srv.close()
    }).then(done).catch(done)
  })
})
