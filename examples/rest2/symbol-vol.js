'use strict'

process.env.DEBUG = process.env.SILENT ? '' : 'bfx:examples:*'

const Table = require('../../lib/util/cli_table')
const debug = require('debug')('bfx:examples:rest2_symbol_vol')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const args = process.argv

if (args.length < 3) {
  debug('error: symbol required (i.e: npm run symbol-vol ETHUSD')
  process.exit(1)
}

const symbol = String(args[2])
const t = Table({
  Period: 10,
  Volume: 20
})

debug('fetching volume stats for %s...', symbol)

rest.volumeStats(symbol).then(stats => {
  let s

  for (let i = 0; i < stats.length; i += 1) {
    s = stats[i]

    t.push([s.period, s.volume])
  }

  console.log(t.toString())
}).catch(console.error)
