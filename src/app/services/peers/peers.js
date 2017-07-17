
import _ from 'lodash'

import './peer'

const UPDATE_INTERVAL_CHECK = 10000

app.factory('$peers', ($peer, $timeout) => {
  class $peers {
    constructor () {
      this.stack = {
        official: [
          new $peer({ host: '34.211.111.67', port: 4000, ssl: false }),
          new $peer({ host: '13.59.176.127', port: 4000, ssl: false }),
          new $peer({ host: '54.175.122.162', port: 4000, ssl: false }),
          new $peer({ host: '13.126.40.180', port: 4000, ssl: false }),
          new $peer({ host: '54.93.85.178', port: 4000, ssl: false }),
          new $peer({ host: '54.246.214.229', port: 4000, ssl: false }),
          new $peer({ host: '35.182.28.68', port: 4000, ssl: false }),
          new $peer({ host: '54.153.35.65', port: 4000, ssl: false }),
          new $peer({ host: '54.252.170.222', port: 4000, ssl: false })
        ],
        public: [],
        testnet: [
          // new $peer({ host: '127.0.0.1', port: 4000, ssl: false }),
        ]
      }

      this.check()
    }

    reset (active) {
      $timeout.cancel(this.timeout)

      if (active) {
        this.active = undefined
      }
    }

    setActive () {
      this.active = _.chain([])
        .concat(this.stack.official, this.stack.public)
        .sample()
        .value()

      this.check()
    }

    check () {
      this.reset()

      let next = () => this.timeout = $timeout(this.check.bind(this), UPDATE_INTERVAL_CHECK)

      if (!this.active) {
        return next()
      }

      this.active.status()
        .then(() => this.online = true)
        .catch(() => this.online = false)
        .finally(() => next())
    }
  }

  return new $peers()
})
