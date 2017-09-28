/* 
	This is an example of an authenticated REST request. 
	This example fetches the last 25 orders on your account. 
 */
'use strict'

const BFX = require('bitfinex-api-node') 

const CREDENTIALS = 
	{"API_KEY": '',
	 "API_SECRET": '' };
	 
const opts = {  version: 2, autoOpen: false }
const brest = new BFX(CREDENTIALS.API_KEY, CREDENTIALS.API_SECRET, opts)

const TIME_PROGRAM_STARTED = Date.now()
const ONE_DAY_IN_MS = 86400000 

const PAYLOAD = 
	{"start":TIME_PROGRAM_STARTED - ONE_DAY_IN_MS,
	"end": TIME_PROGRAM_STARTED, 
	"limit":25} /* If you try and request more than 25 then the API will return "invalid" */

brest.rest.makeAuthRequest("/auth/r/orders/tETHUSD/hist", PAYLOAD, function (ERROR, REPLY) {
    if (ERROR) {
    	console.log(ERROR)
    	return 
    }
    console.log(REPLY)
})
