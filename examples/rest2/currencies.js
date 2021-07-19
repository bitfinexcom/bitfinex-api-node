'use strict'

const _chunk = require('lodash/chunk')
const { RESTv2 } = require('../../index')
const { debug } = require('../util/setup')

async function execute () {
  const rest = new RESTv2()
  debug('fetching currency list...')

  const currencies = await rest.currencies()

  debug('received %d currencies', currencies[0].length)

  debug('')
  _chunk(currencies[0], 10).forEach((currencyChunk) => {
    debug('%s', currencyChunk.join(', '))
  })
  debug('')
}

execute()
