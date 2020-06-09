'use strict'

/**
 * An object describing an order book data channel on a WSv2 data stream.
 *
 * @typedef {object} OrderBookChannel
 * @property {string} channel - 'book'
 * @property {number} chanId - channel ID
 * @property {string} symbol - symbol
 * @property {string} freq - frequency of updates; 'F0' is realtime, 'F1' is
 *   once per 2 seconds
 * @property {string} prec - precision, (aggregate 'P0', 'P1', 'P2', 'P3',
 *   'P4', raw 'R0')
 * @property {string} len - book depth, '25' (default) or '100'
 */
