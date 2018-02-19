'use strict'

const Table = require('cli-table2')

/**
 * Converts a column map (i.e. `{ [name]: [width] }`) to a new cli-table2 table
 *
 * @param {Object} columns - name/width map
 * @return {Table} t
 */
module.exports = (columns = {}) => {
  const headers = Object.keys(columns)

  return new Table({
    head: headers,
    colWidths: headers.map(h => columns[h])
  })
}
