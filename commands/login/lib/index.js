'use strict';
const inquirer = require('inquirer')
const axios = require('axios')

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
  const { data } = await axios.post('http://192.168.8.250:81/zentao/user-login.json', {
    data: {
      account: 'sdy',
      password: '97e27f2cb32b89431c828f0d597e3876',
    }
  })
  console.log(JSON.parse(data.data))
  // const { system, username, password } = await getBaseInfo(inputSystem)
  // console.log('system', system)
  // console.log('username', username)
  // console.log('password', password)
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
    username,
    password
  }
}


module.exports = loginAction