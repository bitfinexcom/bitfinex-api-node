'use strict'

const runExample = require('../util/run_example')
const symbol = 'fUSD'

module.exports = runExample({
  name: 'ws2-funding-info',
  ws: { env: true, connect: true, auth: true, transform: true }
}, async ({ ws, debug }) => {
  ws.onFundingInfoUpdate({}, fiu => {
    fiu.forEach(fl => debug('fl: %j', fl.toJS()))
  })

  ws.requestCalc([`funding_sym_${symbol}`])
})
