'use strict'

const zipObject = require('lodash/zipObject')

const maps = require('./maps')

module.exports = (exports = transform)
function transform (data, type, symbol) {
  const subtype = getSubtype(symbol)
  const props = maps[type][subtype]

  return zipObject(props, data)
}

exports.normalize = normalize
function normalize (name) {
  if (!name) return

  const type = name.split('/')[0]
  const symbol = name.split('/')[1]

  return { type, symbol }
}

exports.getSubtype = getSubtype
function getSubtype (symbol) {
  return (/^t/).test(symbol) ? 'tradingPairs' : 'fundingCurrencies'
}
