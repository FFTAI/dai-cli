const inquirer = require('inquirer')
const { getBaseInfo } = require('@fftai/dai-cli-util')
const log = require('@fftai/dai-cli-log')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const Gitea = require('@fftai/dai-cli-models-gitea')
const commander = require('commander')

const program = new commander.Command()

const systemList = [
  'zentao',
  'gitea'
]

const systemPrompt = {
  type: 'list',
  name: 'system',
  message: '选择登录的系统',
  default: 'zentao',
  choices: [{
    name: '蝉道',
    value: 'zentao'
  }, {
    name: 'gitea',
    value: 'gitea',
  }]
}

function initLoginCommand () {
  return program
    .command('login [system]')
    .description(`登录某个系统 目前支持的值：${systemList.join(', ')}`)
    .action(loginAction)
}

async function loginAction (inputSystem) {
  let system = inputSystem

  
  if (system === 'gitea') {
    const gitea = new Gitea()
    await gitea.init()
    log.success('登录成功！')
    return
  }

  if (!system) {
    const result = await inquirer.prompt(systemPrompt)
    system = result.system
  }
  if (system === 'zentao') {
    const { account, password } = await getBaseInfo(inputSystem)
    log.verbose(account)
    log.verbose(password)
    await ZenTao.checkRequestUrl()
    log.verbose('login zentao')
    try {
      const zentao = new ZenTao()
      zentao.login(account, password)
    } catch (err) {
      log.error(err)
    }
  }
}

module.exports = initLoginCommand()