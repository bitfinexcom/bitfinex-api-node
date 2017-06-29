'use strict'

const { isSnapshot } = require('./helper')

function normalizeBooks (data, prec) {
  if (prec !== 'R0') return data

  let res
  if (isSnapshot(data)) {
    res = data.map((el) => {
      return [
        el[0], el[1], el[2]
      ]
    })

    return res
  }

  // its an update
  return [ data[0], data[1], data[2] ]
}

module.exports = normalizeBooks
