/* global describe it */

const {expect} = require('chai')
const BFX = require('../index')

describe('Loading Module', () => {
    describe('#BFX', () => {
        it('should be loaded', () => {
            expect(BFX).to.be.a.function
        })
    })
})