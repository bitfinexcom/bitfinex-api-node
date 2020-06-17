const { FundingOffer } = require('bfx-api-node-models')
const { WSv2 } = require('../..')
// from 'bitfinex-api-node' module
// const { WSv2 } = require('bitfinex-api-node')

;(async () => {
  const ws2 = new WSv2({
    apiKey: '<your-api-key>',
    apiSecret: '<your-api-secret>'
    // you can obtain your keys from https://www.bitfinex.com/api
  })

  try {
    await ws2.open()
    await ws2.auth()

    ws2.onFundingOfferNew({ symbol: 'fUSD' }, (resp) => {
      console.log('onFundingOfferNew:', resp)
    })

    ws2.submitFundingOffer(new FundingOffer({
      type: 'LIMIT',
      symbol: 'fUSD',
      amount: '-50',
      rate: '0.001',
      period: 2,
      flags: 0
    }))
  } catch (error) {
    console.log('error: ', error)
  }
})()
