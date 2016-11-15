const BFX = require('../ws2.js')

bfx = new BFX('VGUO8bvBLk01HEy6Mhd5Dv8ZPKWpFK3n8ImNkoHL5FC', 'fsXBn8GfVnHI09XmnkJiL78JzyZeYoSIGZFhHEaFvlZ')

cb = (a)=>console.log(a)

bfx.on('on', function(order){
	bfx.cancelOrder(order[0])
})
// bfx.on('ou', cb)
// bfx.on('oc', cb)
// bfx.on('te', cb)
bfx.on('auth', function(){
	start = Date.now()
	let i = 0
	do {
		let price = (800 + i).toString()
		bfx.submitOrder([0, "on", null, { cid: Date.now()*1000, type: "LIMIT", pair: "BTCUSD", amount: "-0.01", price: price }])
		i++
		console.log(`Order ${i}took ${Date.now()-start} milliseconds`)
	} while(i < 100)
})
bfx.on('open', function(){
	bfx.auth()
})
