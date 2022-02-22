const inquirer = require('inquirer')
const log = require('@fftai/dai-cli-log')
const ZenTao = require('@fftai/dai-cli-models-zentao')

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

const usernamePrompt = {
  type: 'input',
  name: 'username',
  message: '账号',
  default: '',
  validate: function (input)  {
    const done = this.async();
    setTimeout(function () {
      if (!input) {
        done(`请输入账号`);
      }
      done(null, true);
    }, 0);
  }
}

const passwordPrompt = {
  type: 'password',
  name: 'password',
  message: '密码',
  default: '',
  validate: function (input)  {
    const done = this.async();
    setTimeout(function () {
      if (!input) {
        done(`请输入密码`);
      }
      done(null, true);
    }, 0);
  }
}

async function loginAction (inputSystem) {
  const { system, account, password } = await getBaseInfo(inputSystem)
  log.verbose(account)
  log.verbose(password)
  if (system === 'zentao') {
    log.verbose('login zentao')
    try {
      const zentao = new ZenTao()
      zentao.login(account, password)
    } catch (err) {
      log.error(err)
    }
  }
  if (system === 'gitea') {
    log.info('即将上线')
  }
}

async function getBaseInfo (inputSystem) {
  const prompts = [
    usernamePrompt,
    passwordPrompt
  ]
  if (!inputSystem || !systemList.some(sys => sys === inputSystem)) {
    prompts.unshift(systemPrompt)
  }
  const { system: promptSystem, username, password } = await inquirer.prompt(prompts)
  return {
    system: inputSystem || promptSystem,
    account: username,
    password
  }
}


module.exports = loginAction