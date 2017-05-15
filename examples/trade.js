const BitfinexWS = require('bitfinex-api-node').WS
const {version} = require('bitfinex-api-node/package.json')
const bws = new BitfinexWS()
console.log(process.cwd())
console.log(version)
bws.on('open', () => {
  bws.subscribeTrades('BTCUSD')
})

bws.on('trade', (pair, trade) => {
  console.log('Trade:', trade)
})
