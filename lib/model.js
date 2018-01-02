'use strict'

const { EventEmitter } = require('events')

class Model extends EventEmitter {
  constructor (data = {}) {
    super()

    if (Array.isArray(data)) {
      return Object.assign(this, this.constructor.unserialize(data))
    }

    Object.assign(this, data)
  }

  serialize () {
    return []
  }

  static unserialize () {
    return {}
  }
}

module.exports = Model
