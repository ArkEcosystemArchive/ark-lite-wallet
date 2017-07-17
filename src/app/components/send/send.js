
import './send.less'

const ADDRESS_VALID_RE = /^[B][\w]{1,33}$/
const AMOUNT_VALID_RE = '^[0-9]+(\.[0-9]{1,8})?$'

app.component('send', {
  template: require('./send.jade')(),
  bindings: {
    account: '<',
  },
  controller: class send {
    constructor ($scope, $peers, lsk, success, error, $mdDialog, $q) {
      this.$scope = $scope
      this.$peers = $peers
      this.success = success
      this.error = error
      this.$mdDialog = $mdDialog
      this.$q = $q

      this.recipient = {
        regexp: ADDRESS_VALID_RE,
      }

      this.smartbridge = {}

      this.amount = {
        regexp: AMOUNT_VALID_RE,
      }

      this.$scope.$watch('$ctrl.amount.value', () => {
        this.amount.raw = lsk.from(this.amount.value) || 0
      })

      this.$scope.$watch('$ctrl.account.balance', () => {
        this.amount.max = parseFloat(lsk.normalize(this.account.balance)) - 0.1
      })
    }

    reset () {
      this.recipient.value = ''
      this.smartbridge.value = ''
      this.amount.value = ''
    }

    promptSecondPassphrase () {
      return this.$q((resolve, reject) => {
        const account = this.account
          this.$mdDialog.show({
            controllerAs: '$ctrl',
            template: require('./second.jade')(),
            controller: /*@ngInject*/ class second {
              constructor ($scope, $mdDialog) {
                this.$mdDialog = $mdDialog
                this.account = account
                this.passphrase = ''
                this.secondPassphrase = null
              }

              ok () {
                this.$mdDialog.hide()
                resolve({
                  passphrase: this.passphrase,
                  secondPassphrase: this.secondPassphrase,
                })
              }

              cancel () {
                this.$mdDialog.hide()
                reject()
              }
            }
          })
      })
    }

    go () {
      this.loading = true

      this.promptSecondPassphrase()
        .then((inputs) => {
          this.$peers.active.sendTransaction(
            this.recipient.value,
            this.amount.raw,
            this.smartbridge.value,
            inputs.passphrase,
            inputs.secondPassphrase
          )
          .then(
            (res) => {
              return this.success.dialog({ text: `${this.amount.value} sent to ${this.recipient.value}` })
                .then(() => {
                  this.reset()
                })
            },
            (res) => {
              let errorMsg = 'An error occurred while sending the transaction.'
              if (res && res.error)
                errorMsg = res.error
              else if (res && res.message)
                errorMsg = res.message

              this.error.dialog({ text: errorMsg })
            }
          )
          .finally(() => {
            this.loading = false
          })
        }, () => {
          this.loading = false
        })
    }
  }
})

app.directive('ignoreMouseWheel', () => {
  return {
    restrict: 'A',
    link: (scope, element, attrs) => {
      element.bind('mousewheel', event => element.blur())
    }
  }
})
