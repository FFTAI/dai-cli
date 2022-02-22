'use strict';
const inquirer = require('inquirer')
const axios = require('axios')
const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')
const { setConfig, getConfig, ZENTAO_REQUEST_URL, ZENTAO_SESSION_ID } = require('@fftai/dai-cli-util-config')

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

async function loginAction (inputSystem, { link }) {
  const zentaoRequestUrl = link || getConfig(ZENTAO_REQUEST_URL)
  const { system, account, password } = await getBaseInfo(inputSystem)
  log.verbose(account)
  log.verbose(password)
  if (system === 'zentao') {
    log.verbose('login zentao')
    const loginForm = getLoginForm(account, password)
    const requestUrl = `${zentaoRequestUrl}user-login.json`
    log.verbose('requestUrl', requestUrl)
    try {
      const res = await axios.post(requestUrl, loginForm, { headers: loginForm.getHeaders() })
      const sid = getSid(res.headers['set-cookie'])
      setConfig(ZENTAO_SESSION_ID, sid)
      log.success(`蝉道登录成功！`)
    } catch (err) {
      throw new Error('登录失败', err)
    }
  }
  // getMyTaskList(zentaoRequestUrl, getConfig(ZENTAO_SESSION_ID))
  // const { system, username, password } = await getBaseInfo(inputSystem)
  // console.log('system', system)
  // console.log('username', username)
  // console.log('password', password)
}

function getLoginForm (account, password) {
  const form = new FormData()
  form.append('account', account)
  form.append('password', password)
  return form
}

function getSid (cookies) {
  const cookie = cookies.find(cookie => cookie.includes('zentaosid='))
  if (cookie) {
    return cookie.match(/(?<=zentaosid=)\w+/)[0]
  }
}

async function getMyTaskList (link, sid) {
  try {
    const { data } = await axios.get(`${link}my-task.json?zentaosid=${sid}`)
    console.log(JSON.parse(data.data).tasks)
  } catch (err) {
    console.log('data', data)
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