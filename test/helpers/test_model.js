'use strict'

const assert = require('assert')

const testModel = ({ model, orderedFields, boolFields = [] }) => {
  it('constructs from an array source', () => {
    const m = new model(orderedFields)

    orderedFields.forEach((f) => {
      if (f === null) return

      if (boolFields.indexOf(f) !== -1) {
        assert.equal(m[f], false)
      } else {
        assert.equal(m[f], f)
      }
    })
  })

  it('constructs from an object source', () => {
    const data = {}
    orderedFields.forEach(f => (f !== null) && (data[f] = f))

    const m = new model(data)
    orderedFields.forEach(f => (f !== null) && assert.equal(m[f], f))
  })

  it('serializes correctly', () => {
    const data = {}
    orderedFields.forEach(f => (f !== null) && (data[f] = f))
    boolFields.forEach(f => data[f] = false)

    const m = new model(data)
    const arr = m.serialize()

    arr.forEach((v, i) => {
      if (v === null) return

      if (boolFields.indexOf(orderedFields[i]) !== -1) {
        assert.equal(v, 0)
      } else {
        assert.equal(v, orderedFields[i])
      }
    })
  })

  it('unserializes correctly', () => {
    const m = model.unserialize(orderedFields)
    orderedFields.forEach((f) => {
      if (f === null) return

      if (boolFields.indexOf(f) !== -1) {
        assert.equal(m[f], false)
      } else {
        assert.equal(m[f], f)
      }
    })
  })
}

module.exports = testModel
