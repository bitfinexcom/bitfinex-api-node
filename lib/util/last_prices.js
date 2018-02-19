'use strict'

const Promise = require('bluebird')

/**
 * Fetches the last trade prices for the specified list of symbols. Duplicate
 * symbols are only fetched once, so external datasets can be .map()'ed in.
 *
 * @param {RESTv2} rest - rest client to use
 * @param {string[]} symbols
 * @param {Method?} debug - optional 'debug' instance
 * @return {Promise} p
 */
module.exports = (rest, rawSymbols = [], debug = () => {}) => {
  if (rawSymbols.length === 0) return Promise.resolve({})

  const symbolObj = {}

  // Quick duplicate removal instead of Array.from(new Set(rawSymbols)))
  for (let i = 0; i < rawSymbols.length; i += 1) {
    symbolObj[rawSymbols[i]] = true
  }

  const symbols = Object.keys(symbolObj)
  debug('fetching tickers for: %s...', symbols)

  return rest.tickers(symbols).then(rawTickers => {
    debug('... done')
    const prices = {}

    for (let i = 0; i < rawTickers.length; i += 1) {
      prices[rawTickers[i].symbol] = Number(rawTickers[i].lastPrice)
    }

    return prices
  })
}
