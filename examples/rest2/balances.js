'use strict'

const _uniq = require('lodash/uniq')
const _capitalize = require('lodash/capitalize')
const _isFinite = require('lodash/isFinite')
const _isString = require('lodash/isString')
const { preparePrice, prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-balances',
  rest: {
    env: true,
    transform: true
  },

  params: {
    valueCurrency: argFromCLI(2),
    hideZeroBalances: true,
    filterByType: false,
    filterByCurrency: false
  }
}, async ({ debug, debugTable, rest, params }) => {
  const {
    valueCurrency, hideZeroBalances, filterByType, filterByCurrency
  } = params

  const symbolForWallet = w => `t${w.currency}${valueCurrency}`

  debug('fetching balances')

  const lastPrices = {}
  const allWallets = await rest.balances() // actual balance fetch
  let balances = allWallets

  if (hideZeroBalances) {
    balances = balances.filter(({ available, amount }) => (
      +available !== 0 || +amount !== 0
    ))
  }

  if (_isString(filterByType)) {
    balances = balances.filter(({ type }) =>
      (type.toLowerCase() === filterByType.toLowerCase())
    )
  }

  if (_isString(filterByCurrency)) {
    balances = balances.filter(({ currency }) => (
      currency.toLowerCase() === filterByCurrency.toLowerCase())
    )
  }

  if (balances.length === 0) {
    return debug('no wallets match provided filters')
  }

  balances = balances.map(w => ({
    ...w,
    currency: w.currency.toUpperCase(),
    inValueCurrency: w.currency.toUpperCase() === (valueCurrency || '')
  }))

  debug(
    'found %d non-zero balances: %s',
    balances.length, balances.map(({ currency }) => currency).join(', ')
  )

  const rows = balances.map(({ currency, type, amount, available }) => ([
    _capitalize(type),
    currency,
    prepareAmount(amount),
    prepareAmount(available)
  ]))

  // Pull in ticker data if the user specified a value currency
  // Balance in BTC, value in USD -> We need to fetch tBTCUSD (last price)
  if (valueCurrency) {
    const balancesToConvert = balances.filter(({ inValueCurrency }) => !inValueCurrency)
    const symbols = _uniq(balancesToConvert.map(symbolForWallet))
    debug('fetching tickers for: %s', symbols.join(', '))

    const tickers = await rest.tickers(symbols)
    tickers.map(({ symbol, lastPrice }) => (lastPrices[symbol] = +lastPrice))

    const totalValue = balances.map(({ currency, amount, inValueCurrency }, i) => {
      const value = inValueCurrency
        ? amount
        : lastPrices[symbolForWallet({ currency })] * amount

      // add value data to table rows
      if (_isFinite(value)) {
        rows[i].push(prepareAmount(value))
        rows[i].push(inValueCurrency
          ? '-'
          : preparePrice(lastPrices[symbolForWallet({ currency })])
        )

        return value
      } else {
        rows[i].push('-')
        rows[i].push('-')

        return 0
      }
    }).reduce((prev, curr) => prev + curr, 0)

    debug('total value: %d %s', prepareAmount(totalValue), valueCurrency)
  }

  debugTable({
    rows,
    headers: [
      'Type', 'Symbol', 'Total', 'Available', ...(!valueCurrency ? [] : [
        `Value (${valueCurrency})`,
        `Unit Price (${valueCurrency})`
      ]
      )]
  })
})
