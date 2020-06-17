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

    ws2.onFundingOfferClose({}, (resp) => {
      console.log('onFundingOfferClose: ', resp)
    })

    ws2.cancelFundingOffer('<insert-your-funding-offer-id>')
  } catch (error) {
    console.log('error: ', error)
  }
})()
