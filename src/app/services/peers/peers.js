
import _ from 'lodash'

import './peer'

const UPDATE_INTERVAL_CHECK = 10000

app.factory('$peers', ($peer, $timeout) => {
  class $peers {
    constructor () {
      this.stack = {
        official: [
          new $peer({ host: '127.0.0.1' }),
        //   new $peer({ host: 'node01.lisk.io' }),
        ],
        public: [],
        testnet: [
          new $peer({ host: 'testnet.lisk.io', port: null, ssl: true }),
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
