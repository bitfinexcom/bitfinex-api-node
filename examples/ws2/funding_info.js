'use strict'

const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')
const symbol = 'fUSD'

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    transform: true
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()
  await ws.auth()

  ws.onFundingInfoUpdate({}, fi => {
    debug('fl: %j', fi.toJS())
    ws.close()
  })

  ws.requestCalc([`funding_sym_${symbol}`])
}

execute()
