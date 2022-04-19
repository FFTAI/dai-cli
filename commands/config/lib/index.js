const { listConfig, setConfig, getConfig, cleanConfig } = require('@fftai/dai-cli-util-config')
const log = require('@fftai/dai-cli-log')
const commander = require('commander')
const program = new commander.Command()

function initConfigCommand () {
  program
    .name('config')

  program
    .command('list [name]', { isDefault: true })
    .description('列出配置，不传 [name] 则列出所有配置')
    .action(listAction)

  program
    .command('set <name> <value>')
    .description('写入配置')
    .action(setAction)

  program
    .command('clean')
    .description('清空配置')
    .action(cleanAction)

  return program
}

function listAction (name) {
  if (name) {
    const config = getConfig(name)
    log.info(name, config)
  } else {
    listConfig()
  }
}

function setAction (name, value) {
  setConfig(name, value)
  log.success('配置写入成功', `${name} = ${value}`)
}

function cleanAction () {
  cleanConfig()
}

module.exports = initConfigCommand()