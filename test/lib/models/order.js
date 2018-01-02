/* eslint-env mocha */
'use strict'

const assert = require('assert')
const { Order } = require('../../../lib/models')
const WSv2 = require('../../../lib/transports/ws2')
const testModel = require('../../helpers/test_model')

describe('Order model', () => {
  testModel({
    model: Order,
    boolFields: ['notify', 'hidden'],
    orderedFields: [
      'id', 'gid', 'cid', 'symbol', 'mtsCreate', 'mtsUpdate', 'amount',
      'amountOrig', 'type', 'typePrev', null, null, 'flags', 'status', null,
      null, 'price', 'priceAvg', 'priceTrailing', 'priceAuxLimit', null, null,
      null, 'notify', 'hidden', 'placedId'
    ]
  })

  it('registerListeners: sets up ws2 listeners for on/ou/oc messages', () => {
    const ws = new WSv2()
    assert.equal(Object.keys(ws._listeners).length, 0)

    const o = new Order({}, ws)
    o.registerListeners()

    assert.equal(Object.keys(ws._listeners).length, 1)
    assert(ws._listeners[o.cbGID()])
    assert.equal(Object.keys(ws._listeners[o.cbGID()]).length, 3)
  })

  it('registerListeners: uses provided ws, or defaults to internal ws', () => {
    const wsA = new WSv2()
    const wsB = new WSv2()
    assert.equal(Object.keys(wsA._listeners).length, 0)
    assert.equal(Object.keys(wsB._listeners).length, 0)

    const oInternal = new Order({}, wsA)
    const oProvided = new Order({})

    oInternal.registerListeners()
    oProvided.registerListeners(wsB)

    assert.equal(Object.keys(wsA._listeners).length, 1)
    assert(wsA._listeners[oInternal.cbGID()])
    assert.equal(Object.keys(wsA._listeners[oInternal.cbGID()]).length, 3)

    assert.equal(Object.keys(wsB._listeners).length, 1)
    assert(wsB._listeners[oProvided.cbGID()])
    assert.equal(Object.keys(wsB._listeners[oProvided.cbGID()]).length, 3)
  })

  it('registerListeners: does nothing if no ws is available', () => {
    const o = new Order()
    assert.doesNotThrow(() => o.registerListeners())
  })

  it('removeListeners: removes all registered ws2 listeners', () => {
    const o = new Order()
    const ws = new WSv2()
    assert.equal(Object.keys(ws._listeners).length, 0)
    o.registerListeners(ws)
    assert.equal(Object.keys(ws._listeners).length, 1)
    o.removeListeners(ws)
    assert.equal(Object.keys(ws._listeners).length, 0)
  })

  it('removeListeners: uses ws argument if provided', () => {
    const wsA = new WSv2()
    const wsB = new WSv2()
    const o = new Order({}, wsB)

    assert.equal(Object.keys(wsA._listeners).length, 0)
    assert.equal(Object.keys(wsB._listeners).length, 0)

    o.registerListeners(wsA)

    assert.equal(Object.keys(wsA._listeners).length, 1)
    assert.equal(Object.keys(wsB._listeners).length, 0)

    o.removeListeners(wsA)

    assert.equal(Object.keys(wsA._listeners).length, 0)
    assert.equal(Object.keys(wsB._listeners).length, 0)
  })

  it('removeListeners: does nothing if no ws is available', () => {
    const o = new Order()
    assert.doesNotThrow(() => o.removeListeners())
  })

  it('submit: uses provided ws, or defaults to internal ws', (done) => {
    const wsA = new WSv2()
    const wsB = new WSv2()
    const oA = new Order()
    const oB = new Order({}, wsB)

    let submitA = false
    let submitB = false

    wsA.submitOrder = () => {
      submitA = true
      return Promise.resolve([])
    }

    wsB.submitOrder = () => {
      submitB = true
      return Promise.resolve([])
    }

    oA.submit(wsA).then(() => {
      assert(submitA)
      return oB.submit()
    }).then(() => {
      assert(submitB)
      done()
    }).catch(done)
  })

  it('submit: rejects if no ws is available', (done) => {
    const o = new Order()

    o.submit().then(() => {
      assert(false)
    }).catch((e) => {
      assert(e.message.indexOf('no ws') !== -1)
      done()
    })
  })

  it('submit: submits order via ws and saves any changes from the response', (done) => {
    const ws = new WSv2()
    const o = new Order({}, ws)

    ws.submitOrder = () => {
      return Promise.resolve(new Order({
        id: 1,
        gid: 2,
        cid: 3,
        type: 'EXCHANGE LIMIT',
        symbol: 42
      }).serialize())
    }

    o.submit().then(() => {
      assert.equal(o.id, 1)
      assert.equal(o.gid, 2)
      assert.equal(o.cid, 3)
      assert.equal(o.type, 'EXCHANGE LIMIT')
      assert.equal(o.symbol, 42)
      done()
    })
  })

  it('cancel: uses provided ws, or defaults to internal ws', (done) => {
    const wsA = new WSv2()
    const wsB = new WSv2()
    const oA = new Order({ id: 41 })
    const oB = new Order({ id: 42 }, wsB)

    let cancelA = false
    let cancelB = false

    wsA.cancelOrder = () => {
      cancelA = true
      return Promise.resolve([])
    }

    wsB.cancelOrder = () => {
      cancelB = true
      return Promise.resolve([])
    }

    oA.cancel(wsA).then(() => {
      assert(cancelA)
      return oB.cancel()
    }).then(() => {
      assert(cancelB)
      done()
    }).catch(done)
  })

  it('cancel: rejects if no ws is available', (done) => {
    const o = new Order({ id: 42 })

    o.cancel().then(() => {
      assert(false)
    }).catch((e) => {
      assert(e.message.indexOf('no ws') !== -1)
      done()
    })
  })

  it('cancel: rejects if order has no ID', (done) => {
    const ws = new WSv2()
    const o = new Order({}, ws)

    ws.cancelOrder = () => Promise.resolve()

    o.cancel().then(() => {
      assert(false)
    }).catch((e) => {
      assert(e.message.indexOf('no ID') !== -1)
      done()
    })
  })

  it('cancel: cancels the order by ID via the ws client', (done) => {
    const ws = new WSv2()
    const o = new Order({ id: 42 }, ws)
    let canceled = false

    ws.cancelOrder = (id) => {
      assert.equal(id, 42)
      canceled = true
      return Promise.resolve()
    }

    o.cancel().then(() => {
      assert(canceled)
      done()
    })
  })

  it.skip('recreate: uses provided ws, or defaults to internal ws')
  it.skip('recreate: passes ws through to cancel & submit')

  it('recreate: rejects if no ws is available', (done) => {
    const o = new Order({ id: 42 })

    o.recreate().then(() => {
      assert(false)
    }).catch((e) => {
      assert(e.message.indexOf('no ws') !== -1)
      done()
    })
  })

  it('recreate: rejects if order has no ID', (done) => {
    const ws = new WSv2()
    const o = new Order({}, ws)

    o.recreate().then(() => {
      assert(false)
    }).catch((e) => {
      assert(e.message.indexOf('no ID') !== -1)
      done()
    })
  })

  it('recreate: cancels & submits the order as new w/ null ID', (done) => {
    const ws = new WSv2()
    const o = new Order({ id: 42 }, ws)

    let canceled = false
    let submitted = false

    o.submit = () => {
      assert.equal(o.id, null)
      submitted = true
      return Promise.resolve()
    }

    o.cancel = () => {
      assert.equal(o.id, 42)
      canceled = true
      return Promise.resolve()
    }

    o.recreate().then(() => {
      assert(canceled)
      assert(submitted)
      done()
    }).catch(done)
  })

  it('recreate: saves new order data off of response', (done) => {
    const ws = new WSv2()
    const o = new Order({ id: 42 }, ws)

    o.cancel = () => Promise.resolve()
    ws.submitOrder = () => {
      return Promise.resolve(new Order({
        id: 128
      }).serialize())
    }

    o.recreate().then(() => {
      assert.equal(o.id, 128)
      done()
    }).catch(done)
  })

  it('getLastFillAmount: respects _lastAmount & amount', () => {
    const o = new Order()
    o.amount = 5
    o._lastAmount = 7
    assert.equal(o.getLastFillAmount(), 2)
    o._lastAmount = 6
    assert.equal(o.getLastFillAmount(), 1)
    o._lastAmount = 3
    o.amount = 1
    assert.equal(o.getLastFillAmount(), 2)
  })

  const testHandlerFillUpdate = (handler) => {
    const o = new Order({ id: 100, amount: 10 })
    const oArr = [42]
    oArr[6] = 8
    o[handler](oArr)
    oArr[6] = 6
    o[handler](oArr)
    assert.equal(o._lastAmount, 8)
  }

  it('_onWSOrderUpdate: updates last fill amount', () => {
    testHandlerFillUpdate('_onWSOrderUpdate')
  })

  it('_onWSOrderUpdate: saves data off of request', () => {
    const o = new Order({ id: 100 })
    o._onWSOrderUpdate([42])
    assert.equal(o.id, 42)
  })

  it('_onWSOrderUpdate: emits update event', (done) => {
    const o = new Order({ id: 100 })
    o.on('update', () => done())
    o._onWSOrderUpdate([42])
  })

  it('_onWSOrderClose: updates last fill amount', () => {
    testHandlerFillUpdate('_onWSOrderClose')
  })

  it('_onWSOrderClose: saves data off of request', () => {
    const o = new Order({ id: 100 })
    o._onWSOrderClose([42])
    assert.equal(o.id, 42)
  })

  it('_onWSOrderClose: emits close event', (done) => {
    const o = new Order({ id: 100 })
    o.on('close', () => done())
    o._onWSOrderClose([42])
  })

  it('_onWSOrderNew: updates last fill amount', () => {
    testHandlerFillUpdate('_onWSOrderNew')
  })

  it('_onWSOrderNew: saves data off of request', () => {
    const o = new Order({ id: 100 })
    o._onWSOrderNew([42])
    assert.equal(o.id, 42)
  })

  it('_onWSOrderNew: emits update event', (done) => {
    const o = new Order({ id: 100 })
    o.on('update', () => done())
    o._onWSOrderNew([42])
  })

  it('toNewOrderPacket: uses correct values', () => {
    const o = new Order({
      id: 1,
      gid: 2,
      cid: 3,
      symbol: 'tBTCUSD',
      type: 'EXCHANGE LIMIT',
      priceTrailing: 0.1,
      priceAuxLimit: 0.2,
      price: 0.3,
      amount: 0.4,
      hidden: true,
      postonly: false
    })

    const p = o.toNewOrderPacket()

    assert.equal(p.constructor.name, 'Object')
    assert(!p.id)
    assert.equal(p.gid, 2)
    assert.equal(p.cid, 3)
    assert.equal(p.symbol, 'tBTCUSD')
    assert.equal(p.type, 'EXCHANGE LIMIT')
    assert.equal(p.price_trailing, '0.1')
    assert.equal(p.price_aux_limit, '0.2')
    assert.equal(p.price, '0.3')
    assert.equal(p.amount, '0.4')
    assert.equal(p.hidden, 1)
    assert.equal(p.postonly, 0)
  })
})
