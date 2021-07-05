'use strict'

const dotenv = require('dotenv')
const argsFromEnv = require('./args_from_env')
const D = require('./debug').get()
const debug = D('>')
debug.enabled = true

dotenv.config()

module.exports = {
  get args () {
    return argsFromEnv()
  },
  debug
}
