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

    ws2.onFundingCreditClose({}, (resp) => {
      console.log('onFundingCreditClose: ', resp)
    })

    ws2.closeFundingCredit('<insert-your-funding-credit-id>')
  } catch (error) {
    console.log('error: ', error)
  }
})()
