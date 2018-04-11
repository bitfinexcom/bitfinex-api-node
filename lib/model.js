'use strict'

const { EventEmitter } = require('events')

class Model extends EventEmitter {
  constructor (data = {}, fields = {}, boolFields = [], fieldKeys = []) {
    super()

    this._fields = fields
    this._boolFields = boolFields
    this._fieldKeys = fieldKeys

    if (Array.isArray(data)) {
      return Object.assign(this, this.constructor.unserialize(data))
    }

    Object.assign(this, data)
  }

  serialize () {
    const arr = []
    let i, key

    for (let j = 0; j < this._fieldKeys.length; j += 1) {
      key = this._fieldKeys[j]
      i = this._fields[key]
      arr[i] = this[key]

      if (this._boolFields.indexOf(key) !== -1) {
        arr[i] = arr[i] ? 1 : 0
      }
    }

    return arr
  }

  /**
   * @return {Object} pojo
   */
  toJS () {
    const arr = this.serialize()

    return Model.unserialize(
      arr, this._fields, this._boolFields, this._fieldKeys
    )
  }

  static unserialize (arr, fields, boolFields, fieldKeys) {
    if (Array.isArray(arr[0])) {
      return arr.map(m => {
        return Model.unserialize(m, fields, boolFields, fieldKeys)
      })
    }

    const obj = {}

    fieldKeys.forEach((key) => {
      if ((fields[key] + '').length === 0) return

      obj[key] = arr[fields[key]]

      // TODO: Convert boolFields to Object to speed lookup
      if (boolFields.indexOf('key') !== -1) {
        obj[key] = obj[key] === 1
      }
    })

    return obj
  }
}

module.exports = Model
