# Introduction

This is the documentation for the Bitfinex Node reference implementation.

## API Access
In order to access the parts of the API which require authentication, you must generate an API key and an API secret
using [this page](https://www.bitfinex.com/account/api)

You can generate as many API keys as you would like, and each of those keys can be customized in a few ways.

### Standard API Key
* The standard API key can be used for all general account activities with two exceptions.

### Read-only Key
* This type of API key can be used to allow passive monitoring of an account. It is not able to make any changes to the
account, or update any data.

### Withdrawal enabled key
* Provides, in addition to the standard key's privileges, the ability to move funds between
wallets or to withdraw funds from your account.

<aside class="notice">
You cannot create an API key that is both enabled for withdrawal AND Read-only.
</aside>