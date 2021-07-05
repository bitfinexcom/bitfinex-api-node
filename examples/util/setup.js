'use strict'

const dotenv = require('dotenv')
const Readline = require('readline-promise').default
const argsFromEnv = require('./args_from_env')
const D = require('./debug').get()
const debug = D('>')
debug.enabled = true

dotenv.config()

module.exports = {
  get args () {
    return argsFromEnv()
  },
  debug,
  get readline () {
    return Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })
  }
}
