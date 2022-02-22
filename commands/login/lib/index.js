'use strict';
const inquirer = require('inquirer')
const axios = require('axios')
const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')

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
  link = link || '192.168.8.250:81/zentao'
  log.verbose('地址', link)
  const loginForm = getLoginForm()
  const res = await axios.post(`http://${link}/user-login.json`, loginForm, { headers: loginForm.getHeaders() })
  try {
    console.log('paresed data', JSON.parse(res.data.data))
  } catch (err) {
    console.log('data', res.data)
  }
  // const sid = getSid(res.headers['set-cookie'])
  // console.log(sid)
  // if (sid) {
  //   getMyTaskList(link, sid)
  // }
  // log.verbose('res', res)
  // const { system, username, password } = await getBaseInfo(inputSystem)
  // console.log('system', system)
  // console.log('username', username)
  // console.log('password', password)
}

function getLoginForm () {
  const form = new FormData()
  form.append('account', 'sdy')
  form.append('password', '74328543')
  return form
}

function getSid (cookies) {
  const cookie = cookies.find(cookie => cookie.includes('zentaosid='))
  if (cookie) {
    return cookie.match(/(?<=zentaosid=)\w+/)[0]
  }
}

async function getMyTaskList (link, sid) {
  log.verbose('sid', sid)
  const { data } = await axios.get(`http://${link}/my-task.json?zentaosid=${sid}`)
  try {
    console.log('parsed data', JSON.parse(data.data))
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
    username,
    password
  }
}


module.exports = loginAction