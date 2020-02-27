'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-symbols',
  rest: { transform: true }
}, async ({ rest, debug }) => {
  debug('fetching symbol list...')

  const symbols = await rest.symbols()

  debug('read %d symbols', symbols.length)
  debug('%s', symbols.map(s => `t${s.toUpperCase()}`).join(', '))
})
