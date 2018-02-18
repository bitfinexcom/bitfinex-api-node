'use strict'

const Big = require('bignumber.js')

const ROUND_DOWN = 1
const ROUND_CEIL = 2
const ROUND_FLOOR = 3

const round10 = (v = 0, decimals = 0) => {
  return _10(ROUND_DOWN, v, decimals)
}

const floor10 = (v = 0, decimals = 0) => {
  return _10(ROUND_FLOOR, v, decimals)
}

const ceil10 = (v = 0, decimals = 0) => {
  return _10(ROUND_CEIL, v, decimals)
}

const _10 = (action = ROUND_DOWN, value = 0, decimals = 0) => {
  const v = value === null || typeof value === 'undefined'
    ? 0
    : value

  return new Big((v).toString()).toFixed(decimals, action)
}

module.exports = {
  round10,
  floor10,
  ceil10
}
