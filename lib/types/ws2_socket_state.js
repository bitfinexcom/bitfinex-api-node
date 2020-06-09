'use strict'

/**
 * Object containing socket state for {@link WS2Manager}.
 *
 * @typedef {object} WS2Manager~SocketState
 * @property {WSv2} ws - client instance
 * @property {Array[]} pendingSubscriptions - array of sent but unconfirmed
 *   channel subscriptions
 * @property {Array[]} pendingUnsubscriptions - array of sent but unconfirmed
 *   channel unsubscribe packets
 */
