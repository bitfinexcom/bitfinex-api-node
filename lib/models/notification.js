'use strict'

const Model = require('../model')

class Notification extends Model {
  serialize () {
    return [
      this.mts,
      this.type,
      this.messageID,
      this.notifyInfo,
      this.code,
      this.status,
      this.text
    ]
  }

  static unserialize (arr) {
    return {
      mts: arr[0],
      type: arr[1],
      messageID: arr[2],
      notifyInfo: arr[3],
      code: arr[4],
      status: arr[5],
      text: arr[6]
    }
  }
}

module.exports = Notification
