'use strict'

const dotenv = require('dotenv')
const _isEmpty = require('lodash/isEmpty')
const _isObject = require('lodash/isObject')
const { RESTv2 } = require('bfx-api-node-rest')

const WSv2 = require('../../lib/transports/ws2')
const argsFromEnv = require('./args_from_env')
const debugTableUtil = require('./debug_table')
const D = require('./debug').get()

/**
 * Helper to execute an async example with a debugger pre-initialized and
 * WSv2/RESTv2 instances if requested. Captures errors and logs helpful
 * information in case of config load failure.
 *
 * @param {Object} args
 * @param {string} args.name - example name, used in debug string
 * @param {bool|Object?} args.ws - if passed, a WSv2 connection is provided
 * @param {bool?} args.ws.connect - if true, the connection is opened
 * @param {bool?} args.ws.env - if true, the instance receives credentials/connection info from .env
 * @param {bool?} args.ws.args - further args, passed to WSv2 constructor
 * @param {bool|Object} args.rest - if passed, a RESTv2 instance is provided
 * @param {bool?} args.rest.env - if true, the instance receives credentials/connection info from .env
 * @param {bool?} args.rest.args - further args, passed to RESTv2 constructor
 * @param {Function} example - must return a promise
 * @return {Promise} p - resolves on example completion
 */
module.exports = (args = {}, example = async () => { }) => {
  const { noCatch, name, ws, rest, params } = args

  // TODO: extract timeout body
  // we return an override method for params below the timeout block
  setTimeout(async () => {
    if (_isEmpty(name)) {
      throw new Error('no example name provided')
    }

    const debug = D('>')
    debug.enabled = true

    /**
     * Log a table to the console
     *
     * @param {Object} args
     * @param {Object[]} args.rows - data, can be specified as 2nd param
     * @param {string[]} args.headers - column labels
     * @param {number[]} args.widths - column widths
     * @param {Object[]} extraRows - optional row spec as 2nd param
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

    if (noCatch) {
      debug('warning, running without error capture!')
    }

    const { env: restEnv, ...restArgs } = _isObject(rest) ? rest : {}
    const {
      env: wsEnv,
      connect: wsAutoConnect,
      auth: wsAutoAuth,
      ...wsArgs
    } = _isObject(ws) ? ws : {}

    // load .env if needed for either API transport
    if (restEnv || wsEnv) {
      dotenv.config()
      debug(
        'attempted config load from .env for %s...',
        [restEnv && 'RESTv2', wsEnv && 'WSv2'].filter(e => !!e).join(', ')
      )
    }

    // Build up example toolset, including API transports
    let toolset

    try {
      toolset = {
        params,
        debug,
        debugTable,

        ...(!rest ? {} : {
          rest: new RESTv2({
            ...(restEnv ? argsFromEnv('REST_URL') : {}),
            ...restArgs
          })
        }),

        ...(!ws ? {} : {
          ws: new WSv2({
            ...(wsEnv ? argsFromEnv('WS_URL') : {}),
            ...wsArgs
          })
        })
      }
    } catch (e) {
      debug('error loading config: %s', e.message)
      debug('did you create a .env file in the current directory?')
      debug('')
      debug('supported values in .env are:')
      debug('')
      debug('API_KEY=...')
      debug('API_SECRET=...')
      debug('WS_URL=...')
      debug('REST_URL=...')
      debug('SOCKS_PROXY_URL=...')
      debug('VERBOSE_ERRORS=...')
      return
    }

    if (toolset.ws) {
      toolset.ws.on('error', e => debug('WSv2 error: %s', e.message | e))
    }

    if (wsAutoConnect) {
      debug('connecting with WSv2...')
      await toolset.ws.open()
    }

    if (wsAutoAuth) {
      debug('authenticating with WSv2...')
      await toolset.ws.auth()
    }

    debug('running example %s', name)

    const startMTS = Date.now()

    try {
      await example(toolset)
    } catch (e) {
      debug('error: %s', (process.env.VERBOSE_ERRORS ? e.stack : e.message) || e)

      if (noCatch) {
        throw e // propagate, needed for tests
      }
    }

    debug('finished in %ds', (Date.now() - startMTS) / 1000)
  }, 0)

  return (paramOverrides = {}) => {
    Object.assign(params, paramOverrides)
  }
}
