'use strict'

const { EventEmitter } = require('events')

class Model extends EventEmitter {
  constructor (data = {}, fields = {}, boolFields = [], fieldKeys = []) {
    super()

    this._fields = fields || {}
    this._boolFields = boolFields || []
    this._fieldKeys = fieldKeys

    if (Array.isArray(data)) {
      return Object.assign(this, this.constructor.unserialize(data))
    }

    Object.assign(this, data)
  }

  serialize () {
    const arr = []
    let i

    this._fieldKeys.forEach((key) => {
      i = this._fields[key]
      arr[i] = this[key]

      if (this._boolFields.indexOf(key) !== -1) {
        arr[i] = arr[i] ? 1 : 0
      }
    })

    return arr
  }

  static unserialize (arr, fields, boolFields, fieldKeys) {
    if (Array.isArray(arr[0])) {
      return arr.map(m => {
        return Model.unserialize(m, fields, boolFields, fieldKeys)
      })
    }

    const obj = {}

    fieldKeys.forEach((key) => {
      obj[key] = arr[fields[key]]

      if (boolFields.indexOf('key') !== -1) {
        obj[key] = obj[key] === 1
      }
    })

    return obj
  }
}

module.exports = Model
