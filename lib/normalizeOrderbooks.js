'use strict'

const { isSnapshot } = require('./helper')

function normalizeBooks (data, prec) {
  if (prec !== 'R0') return data

  let res
  if (isSnapshot(data)) {
    res = data[0].map((el) => {
      return [
        el[1], el[0], el[2]
      ]
    })

    return [ res ]
  }

  // its an update
  return [[ data[0][1], data[0][0], data[0][2] ]]
}

module.exports = normalizeBooks
