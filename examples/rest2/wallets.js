'use strict'

const _uniq = require('lodash/uniq')
const _capitalize = require('lodash/capitalize')
const _isFinite = require('lodash/isFinite')
const _isEmpty = require('lodash/isEmpty')
const { prepareAmount } = require('bfx-api-node-util')
const { RESTv2 } = require('../../index')
const { args: { apiKey, apiSecret }, debug, debugTable } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const {
    valueCCY, hideZeroBalances, filterByType, filterByCurrency
  } = {
    hideZeroBalances: true,
    filterByType: false,
    filterByCurrency: false,
    valueCCY: 'USD'
  }

  const symbolForWallet = w => `t${w.currency}${valueCCY}`

  debug('fetching balances')

  const allWallets = await rest.wallets() // actual balance fetch
  const balances = allWallets.filter(w => !( // filter as requested
    (hideZeroBalances && +w.balance === 0) ||
    (!_isEmpty(filterByType) && (w.type.toLowerCase() !== filterByType.toLowerCase())) ||
    (!_isEmpty(filterByCurrency) && (w.currency.toLowerCase() !== filterByCurrency.toLowerCase()))
  )).map(w => ({
    ...w,
    currency: w.currency.toUpperCase(),
    inValueCurrency: w.currency.toUpperCase() === valueCCY
  }))

  if (balances.length === 0) {
    return debug('no wallets match provided filters')
  }

  debug('found %d balances', balances.length)

  // Pull in ticker data for balances which are not in the requested value ccy
  // Balance in BTC, value in USD -> We need to fetch tBTCUSD (last price)
  const lastPrices = {}
  const balancesToConvert = balances.filter(w => w.currency !== valueCCY)
  const symbols = _uniq(balancesToConvert.map(symbolForWallet))

  if (symbols.length > 0) {
    debug('fetching tickers for: %s', symbols.join(', '))
    const tickers = await rest.tickers(symbols)
    tickers.forEach(({ symbol, lastPrice }) => (lastPrices[symbol] = +lastPrice))
  }

  let totalValue = 0
  const rows = balances.map(({ currency, type, balance, balanceAvailable }) => {
    const value = currency !== valueCCY
      ? (lastPrices[symbolForWallet({ currency })] * +balance) || 0
      : +balance

    totalValue += value

    return [
      _capitalize(type),
      currency,
      prepareAmount(balance),
      prepareAmount(balanceAvailable),

      ...(_isFinite(value)
        ? [
            prepareAmount(value),
            currency !== valueCCY
              ? prepareAmount(lastPrices[symbolForWallet({ currency })])
              : 1
          ]
        : [
            '-',
            '-'
          ])
    ]
  })

  debugTable({
    rows,
    headers: [
      'Type', 'Symbol', 'Total', 'Available', `Value (${valueCCY})`,
      `Unit Price (${valueCCY})`
    ]
  })

  debug('total value: %d %s', prepareAmount(totalValue), valueCCY)
}

execute()
