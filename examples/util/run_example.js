const dotenv = require('dotenv')
const Promise = require('bluebird')
const _isEmpty = require('lodash/isEmpty')
const _isobject = require('lodash/isObject')
const { RESTv2 } = require('bfx-api-node-rest')
const Readline = require('readline-promise').default

const WSv2 = require('../../lib/transports/ws2')
const argsFromEnv = require('./args_from_env')
const debugTableUtil = require('./debug_table')
const D = require('./debug').get()

/**
 * Helper to execute an async example with a debugger pre-initialized and
 * WSv2/RESTv2 instances if requested. Captures errors and logs helpful
 * information in case of config load failure.
 *
 * @param {object} args - arguments
 * @param {string} args.name - example name, used in debug string
 * @param {boolean|object} [args.ws] - if passed, a WSv2 connection is provided
 * @param {boolean} [args.ws.connect] - if true, the connection is opened
 * @param {boolean} [args.ws.env] - if true, the instance receives credentials/connection info from .env
 * @param {boolean} [args.ws.args] - further args, passed to WSv2 constructor
 * @param {boolean|object} [args.rest] - if passed, a RESTv2 instance is provided
 * @param {boolean} [args.rest.env] - if true, the instance receives credentials/connection info from .env
 * @param {boolean} [args.rest.args] - further args, passed to RESTv2 constructor
 * @param {object} [args.params] - optional parameters to pass to the example
 * @param {Function} example - must return a promise
 * @returns {Function} paramOverride - func that can be used to override params
 */
module.exports = (args = {}, example = () => { }) => {
  const {
    testing, name, ws, rest, readline, params = {}
  } = args

  if (_isEmpty(name)) {
    throw new Error('no example name provided')
  }

  let timeout = null // saved so it can be cleared/exec prevented by the caller
  let noCatch = false

  /**
   *  TODO: extract timeout body
   *  we return an override method for params below the timeout block
   *
   * @param {object} paramOverrides - merged with default script parameters
   * @returns {Promise} p - resolves on script completion
   */
  const exec = (paramOverrides = {}) => {
    Object.assign(params, paramOverrides)

    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        const debug = D('>')
        debug.enabled = true

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

        const { env: restEnv, ...restArgs } = _isobject(rest) ? rest : {}
        const {
          env: wsEnv,
          connect: wsAutoConnect,
          keepOpen: wsKeepOpen,
          auth: wsAutoAuth,
          ...wsArgs
        } = _isobject(ws) ? ws : {}

        // load .env if needed for either API transport
        if (restEnv || wsEnv) {
          dotenv.config()
        }

        // Build up example toolset, including API transports
        let toolset

        try {
          toolset = {
            env: argsFromEnv(),
            params,
            debug,
            debugTable,

            ...(!readline ? {} : {
              readline: Readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false
              })
            }),

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
          return resolve()
        }

        if (toolset.ws) {
          toolset.ws.on('error', e => debug('WSv2 error: %s', e.message | e))
        }

        if (wsAutoConnect) {
          if (!testing) debug('connecting with WSv2...')
          await toolset.ws.open()
        }

        if (wsAutoAuth) {
          if (!testing) debug('authenticating with WSv2...')
          await toolset.ws.auth()
        }

        const startMTS = Date.now()

        try {
          await example(toolset)
        } catch (e) {
          if (testing || noCatch) {
            reject(e) // propagate, needed for tests
          } else {
            debug('error: %s', (process.env.VERBOSE_ERRORS ? e.stack : e.message) || e)
          }
        } finally {
          if (toolset.ws && toolset.ws.isOpen() && !wsKeepOpen) {
            await toolset.ws.close()
          }

          if (toolset.readline) {
            toolset.readline.close()
          }
        }

        if (!testing) {
          debug('finished in %fs', (Date.now() - startMTS) / 1000)
        }

        resolve()
      }, 0)
    })
  }

  // auto exec by default, can be stopped via skipAutoExec below due to timeout
  exec().catch((e) => {
    D('>')('error: %s', (process.env.VERBOSE_ERRORS ? e.stack : e.message) || e)
  })

  return {
    skipAutoExec: () => clearTimeout(timeout),
    exec: async (params) => {
      noCatch = true // called externally, don't auto-catch errors
      return exec(params)
    }
  }
}
