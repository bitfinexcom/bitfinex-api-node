'use strict'

const dotenv = require('dotenv')
const Readline = require('readline-promise').default
const argsFromEnv = require('./args_from_env')
const debugTableUtil = require('./debug_table')
const D = require('./debug').get()
const debug = D('>')
debug.enabled = true

dotenv.config()

/**
 * Log a table to the console
 *
 * @param {object} args - arguments
 * @param {object[]} args.rows - data, can be specified as 2nd param
 * @param {string[]} args.headers - column labels
 * @param {number[]} args.widths - column widths
 * @param {object[]} extraRows - optional row spec as 2nd param
 */
const debugTable = ({ rows = [], headers, widths }, extraRows = []) => {
  debug('')
  debugTableUtil({
    rows: [...rows, ...extraRows],
    headers,
    widths,
    debug
  })
  debug('')
}
module.exports = {
  get args () {
    return argsFromEnv()
  },
  debug,
  debugTable,
  get readline () {
    return Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })
  }
}
