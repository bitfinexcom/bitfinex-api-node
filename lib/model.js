'use strict'

const { EventEmitter } = require('events')
const { round10 } = require('./util/numbers')

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

  /**
   * Convert the model to a POJO, with field data only.
   *
   * @return {Object} obj
   */
  toJS () {
    const obj = {}

    for (let i = 0; i < this._fieldKeys.length; i += 1) {
      obj[this._fieldKeys[i]] = this[this._fieldKeys[i]]
    }

    return obj
  }

  /**
   * Like toJS(), but rounds for display.
   * TODO: Expand depending on needs, sigfig limits in model schema?
   *
   * @return {Object} obj
   */
  toUI () {
    const obj = this.toJS()
    let k

    for (let i = 0; i < this._fieldKeys.length; i += 1) {
      k = this._fieldKeys[i]

      if (!isNaN(obj[k])) obj[k] = round10(obj[k], 3)
    }

    return obj
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
      if (String(fields[key]).length === 0) return

      obj[key] = arr[fields[key]]

      if (boolFields.indexOf('key') !== -1) {
        obj[key] = obj[key] === 1
      }
    })

    return obj
  }
}

module.exports = Model
