'use strict'

/**
 * Object containing socket state for
* {@link module:bitfinex-api-node.WS2Manager}.
*
* @typedef {object} module:bitfinex-api-node.WS2Manager~SocketState
* @property {module:bitfinex-api-node.WSv2} ws - client instance
* @property {Array[]} pendingSubscriptions - array of sent but unconfirmed
*   channel subscriptions
* @property {Array[]} pendingUnsubscriptions - array of sent but unconfirmed
*   channel unsubscribe packets
*/
