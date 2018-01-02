<a name="Order"></a>

## Order
High level order model; provides methods for execution & can stay updated via
a WSv2 connection

**Kind**: global class  

* [Order](#Order)
    * [new Order(data, ws)](#new_Order_new)
    * _instance_
        * [.registerListeners(ws)](#Order+registerListeners)
        * [.removeListeners(ws)](#Order+removeListeners)
        * [.cbGID()](#Order+cbGID) ⇒ <code>string</code>
        * [.submit(ws)](#Order+submit) ⇒ <code>Promise</code>
        * [.cancel(ws)](#Order+cancel) ⇒ <code>Promise</code>
        * [.recreate(ws)](#Order+recreate) ⇒ <code>Promise</code>
        * [.getLastFillAmount()](#Order+getLastFillAmount) ⇒ <code>number</code>
        * [.getBaseCurrency()](#Order+getBaseCurrency) ⇒ <code>string</code>
        * [.getQuoteCurrency()](#Order+getQuoteCurrency) ⇒ <code>string</code>
        * [.getNotionalValue()](#Order+getNotionalValue) ⇒ <code>number</code>
        * [.serialize()](#Order+serialize) ⇒ <code>Array</code>
        * [.toNewOrderPacket()](#Order+toNewOrderPacket) ⇒ <code>Object</code>
    * _static_
        * [.unserialize(arr)](#Order.unserialize) ⇒ <code>Object</code>
        * [.getBaseCurrency(arr)](#Order.getBaseCurrency) ⇒ <code>string</code>
        * [.getQuoteCurrency(arr)](#Order.getQuoteCurrency) ⇒ <code>string</code>

<a name="new_Order_new"></a>

### new Order(data, ws)

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> &#124; <code>Array</code> | either a map of order fields or a raw array |
| ws | <code>WSv2</code> | optional, saved for a later call to registerListeners() |

<a name="Order+registerListeners"></a>

### order.registerListeners(ws)
Registers for updates/persistence on the specified ws2 instance

**Kind**: instance method of <code>[Order](#Order)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ws | <code>WSv2</code> | optional, defaults to internal ws |

<a name="Order+removeListeners"></a>

### order.removeListeners(ws)
Removes update listeners from the specified ws2 instance

**Kind**: instance method of <code>[Order](#Order)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ws | <code>WSv2</code> | optional, defaults to internal ws |

<a name="Order+cbGID"></a>

### order.cbGID() ⇒ <code>string</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>string</code> - cbGID  
<a name="Order+submit"></a>

### order.submit(ws) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| ws | <code>WSv2</code> | optional, defaults to internal ws |

<a name="Order+cancel"></a>

### order.cancel(ws) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| ws | <code>WSv2</code> | optional, defaults to internal ws |

<a name="Order+recreate"></a>

### order.recreate(ws) ⇒ <code>Promise</code>
Equivalent to calling cancel() followed by submit()

**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| ws | <code>WSv2</code> | optional, defaults to internal ws |

<a name="Order+getLastFillAmount"></a>

### order.getLastFillAmount() ⇒ <code>number</code>
Query the amount that was filled on the last order update

**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>number</code> - amount  
<a name="Order+getBaseCurrency"></a>

### order.getBaseCurrency() ⇒ <code>string</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>string</code> - currency  
<a name="Order+getQuoteCurrency"></a>

### order.getQuoteCurrency() ⇒ <code>string</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>string</code> - currency  
<a name="Order+getNotionalValue"></a>

### order.getNotionalValue() ⇒ <code>number</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>number</code> - value  
<a name="Order+serialize"></a>

### order.serialize() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>Array</code> - o  
<a name="Order+toNewOrderPacket"></a>

### order.toNewOrderPacket() ⇒ <code>Object</code>
Creates an order map that can be passed to the `on` command.

**Kind**: instance method of <code>[Order](#Order)</code>  
**Returns**: <code>Object</code> - o  
<a name="Order.unserialize"></a>

### Order.unserialize(arr) ⇒ <code>Object</code>
**Kind**: static method of <code>[Order](#Order)</code>  
**Returns**: <code>Object</code> - order  

| Param | Type |
| --- | --- |
| arr | <code>Array</code> | 

<a name="Order.getBaseCurrency"></a>

### Order.getBaseCurrency(arr) ⇒ <code>string</code>
**Kind**: static method of <code>[Order](#Order)</code>  
**Returns**: <code>string</code> - currency - base currency from symbol  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | order in ws2 array format |

<a name="Order.getQuoteCurrency"></a>

### Order.getQuoteCurrency(arr) ⇒ <code>string</code>
**Kind**: static method of <code>[Order](#Order)</code>  
**Returns**: <code>string</code> - currency - quote currency from symbol  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | order in ws2 array format |

