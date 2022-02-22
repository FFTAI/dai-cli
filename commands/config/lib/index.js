const { listConfig, setConfig } = require('@fftai/dai-cli-util-config')

function configAction (action = 'list', options) {
  if (action === 'list') {
    listConfig()
  }

  if (action === 'set') {
    setConfig(options.name, options.value)
  }
}

module.exports = configAction