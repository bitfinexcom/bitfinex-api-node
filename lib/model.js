'use strict'

const { EventEmitter } = require('events')

class Model extends EventEmitter {
  constructor (data = {}) {
    super()

    if (data.constructor.name === 'Object') {
      Object.assign(this, data)
    } else if (data.constructor.name === 'Array') {
      Object.assign(this, this.constructor.unserialize(data))
    }
  }

  serialize () {
    return []
  }

  static unserialize () {
    return {}
  }
}

module.exports = Model
