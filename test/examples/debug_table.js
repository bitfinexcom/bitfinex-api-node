'use strict'

const test = require('brittle')
const debugTable = require('../../examples/util/debug_table')

test('debugTable', async (t) => {
  await t.test('prints the table out line by line, and returns it as a multi-line string', (t) => {
    let debugLineCount = 0

    const str = debugTable({
      rows: [[1, 1, 1], [2, 2, 2], [3, 3, 3]],
      headers: ['', '', ''],
      widths: [20, 20, 20],
      debug: () => debugLineCount++
    })

    t.is(str.split('\n').length, debugLineCount)
  })
})

// debugTable does not validate row, header and column counts yet
test.todo('debugTable throws an error if row, header, and column counts don\'t match')
