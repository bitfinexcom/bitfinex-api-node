'use strict'

const Table = require('cli-table2')

/**
 * Generates a CLI table and logs it to the console
 *
 * @param {Object} args
 * @param {Object} args.rows - data
 * @param {Object} args.headers - column headers
 * @param {Object} args.debug - log function
 * @return {string} table
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
