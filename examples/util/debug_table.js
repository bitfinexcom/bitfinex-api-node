'use strict'

const Table = require('cli-table3')

/**
 * Generates a CLI table and logs it to the console
 *
 * @param {object} args - arguments
 * @param {object} args.rows - data
 * @param {object} args.headers - column headers
 * @param {object} args.debug - log function
 * @returns {string} table
 */
module.exports = ({ rows, headers, debug }) => {
  const t = new Table({
    head: headers,
    colWidths: [] // auto-compute
  })

  rows.forEach(r => t.push(r))

  const str = t.toString()
  str.split('\n').map(l => debug('%s', l))
  return str
}
