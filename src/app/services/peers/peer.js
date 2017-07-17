
import lisk from 'bpljs'

const API_PEERS = '/api/peers'
const API_ACCOUNT = '/api/accounts'
const API_BALANCE = '/api/accounts/getBalance'
const API_TRANSACTIONS = '/api/transactions'
const API_NETHASH = '/api/blocks/getNetHash'
const API_SEND_TRANSACTION = '/peer/transactions'
const API_STATUS = '/api/loader/status'

const REQUEST_TIMEOUT = 12000

const TRANSACTION_HEADER_OS = 'ark-lite-wallet'
const TRANSACTION_HEADER_PORT = '4001'
const TRANSACTION_HEADER_VERSION = require('../../../../package.json').version

app.factory('$peer', ($http, $log, $q, $timeout) => {
  return class $peer {
    constructor ({ host, port = 4001, ssl = false }) {
      this.host = host
      this.port = port
      this.ssl = !!ssl
      this.enabled = false
    }

    get uri () {
      return `${this.host}` + (this.port ? `:${this.port}` : '')
    }

    get url () {
      return (this.ssl ? 'https' : 'http') + `://${this.uri}`
    }

    request (method, api, data, headers) {
      let url = this.url + api

      let config = {
        url,
        method,
        headers,
        timeout: REQUEST_TIMEOUT,
      }

      if (method === 'post') {
        config.data = data
      } else {
        config.params = data
      }

      return $http(config)
        .then(res => {
          $log.info(`${method} ${url}`)
          return res
        })
        .then(res => {
          if (!res.data.success) {
            return $q.reject({
              error: res.data.error || null,
              message: res.data.message ||  null,
            })
          } else {
            return res
          }
        })
    }

    get (api, data, headers) {
      return this.request('get', api, data, headers)
    }

    post (api, data, headers) {
      return this.request('post', api, data, headers)
    }

    getPeers () {
      let data = {
        state: 2,
      }

      return this.get(API_PEERS, data)
        .then(res => res.data.peers)
    }

    getAccount (address) {
      return this.get(API_ACCOUNT, { address })
        .then(res => res.data.account)
        .catch(res => {
          return this.getBalance(address)
            .then(balance => {
              return {
                address,
                balance,
              }
            })
        })
    }

    getBalance (address) {
      let data = {
        address,
      }

      return this.get(API_BALANCE, data)
        .then(res => res.data.balance)
    }

    getTransactions (address, limit = 100, orderBy = 'timestamp:desc') {
      let data = {
        senderId: address,
        recipientId: address,
        limit,
        orderBy
      }

      return this.get(API_TRANSACTIONS, data)
        .then(res => res.data)
    }

    getNetHash () {
      return this.get(API_NETHASH)
        .then(res => res.data.nethash)
    }

    sendTransaction (recipient, amount, smartbridge, passphrase, secondPassphrase) {
      let transaction

      try {
        transaction = lisk.transaction.createTransaction(
          recipient,
          amount,
          smartbridge,
          passphrase,
          secondPassphrase
        )
      } catch (e) {
        return $q.reject(e)
      }

      return this.getNetHash()
        .then(nethash => {
          let headers = {
            nethash,
            os: TRANSACTION_HEADER_OS,
            version: TRANSACTION_HEADER_VERSION,
            port: TRANSACTION_HEADER_PORT,
          }

          return this.post(API_SEND_TRANSACTION, { transactions: [ transaction ] }, headers)
        })
    }

    status () {
      return this.get(API_STATUS)
        .then(res => res.data)
    }
  }
})
