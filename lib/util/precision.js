const Big = require('bignumber.js')

const DEFAULT_SIG_FIGS = 5
const PRICE_SIG_FIGS = 5
const AMOUNT_DECIMALS = 8

/**
 * Smartly set the precision (decimal) on a value based off of the significant
 * digit maximum. For example, calling with 3.34 when the max sig figs allowed
 * is 5 would return '3.3400', the representation number of decimals IF they
 * weren't zeros.
 *
 * @param {number} n
 * @param {number} maxSigs - default 5
 * @return {string} str
 */
const setSigFig = (number = 0, maxSigs = DEFAULT_SIG_FIGS) => {
  const n = +(number)
  if (!isFinite(n)) {
    return number
  }
  const value = n.toPrecision(maxSigs)

  return /e/.test(value)
    ? new Big(value).toString()
    : value
}

const setPrecision = (number = 0, decimals = 0) => {
  const n = +(number)

  return (isFinite(n))
    ? n.toFixed(decimals)
    : number
}

const prepareAmount = (amount = 0) => {
  return setPrecision(amount, AMOUNT_DECIMALS)
}

const preparePrice = (price = 0) => {
  return setSigFig(price, PRICE_SIG_FIGS)
}

module.exports = {
  setSigFig, setPrecision, prepareAmount, preparePrice
}
