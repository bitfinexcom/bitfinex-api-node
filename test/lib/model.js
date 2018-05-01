/* eslint-env mocha */
'use strict'

const assert = require('assert')
const Model = require('../../lib/model')

describe('unserialize', () => {
  it('unserializes objects', () => {
    const out = Model.unserialize(
      {
        fieldA: 'first',
        fieldB: 'second',
        boolC: 1,
        boolD: 0
      }, {
        fieldA: 0,
        fieldB: 1,
        boolC: 2,
        boolD: 3
      },
      ['boolC', 'boolD'],
      ['fieldA', 'fieldB', 'boolC', 'boolD']
    )

    assert.deepEqual(out, {
      fieldA: 'first',
      fieldB: 'second',
      boolC: true,
      boolD: false
    })
  })

  it('unserializes arrays', () => {
    const out = Model.unserialize(
      ['first', 'second', 1, 0],
      {
        fieldA: 0,
        fieldB: 1,
        boolC: 2,
        boolD: 3
      },
      ['boolC', 'boolD'],
      ['fieldA', 'fieldB', 'boolC', 'boolD']
    )

    assert.deepEqual(out, {
      fieldA: 'first',
      fieldB: 'second',
      boolC: true,
      boolD: false
    })
  })
})
