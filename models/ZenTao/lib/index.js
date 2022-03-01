const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')
const { setConfig, getConfig, ZENTAO_REQUEST_URL, ZENTAO_SESSION_ID } = require('@fftai/dai-cli-util-config')
const axios = require('axios')
const inquirer = require('inquirer')
const { getBaseInfo } = require('@fftai/dai-cli-util')

async function checkRequestUrl () {
  const requestUrl = getConfig(ZENTAO_REQUEST_URL)
  if (!requestUrl) {
    log.warn(`蝉道 requestUrl 未设置`)
    const { requestUrl } = await inquirer.prompt({
      type: 'input',
      name: 'requestUrl',
      message: '请输入蝉道地址，格式：http://127.0.0.1:88/zentao/',
      default: '',
      validate: function (input)  {
        const done = this.async();
        setTimeout(function () {
          if (!input) {
            done(`请输入蝉道地址`);
          }
          done(null, true);
        }, 0);
      }
    })
    setConfig(ZENTAO_REQUEST_URL, requestUrl)
  }
}

class ZenTao {
  constructor () {
    this.requestUrl = getConfig(ZENTAO_REQUEST_URL)
    this.sid = getConfig(ZENTAO_SESSION_ID)
  }

  async init () {
    if (!this.requestUrl) {
      await this.checkRequestUrl()
    }
    if (!this.sid) {
      const { account, password } = await getBaseInfo()
      await this.login(account, password)
    }
  }

  async checkRequestUrl () {
    await checkRequestUrl()
    this.requestUrl = getConfig(ZENTAO_REQUEST_URL)
  }

  static async checkRequestUrl () {
    await checkRequestUrl()
  }

  async login (account, password) {
    const loginForm = this.getLoginForm(account, password)
    const requestUrl = `${this.requestUrl}user-login.json`
    log.verbose('loginRequestUrl', requestUrl)
    try {
      const res = await axios.post(requestUrl, loginForm, { headers: loginForm.getHeaders() })
      if (res.data.status === 'success') {
        const sid = this.getSid(res.headers['set-cookie'])
        setConfig(ZENTAO_SESSION_ID, sid)
        this.sid = sid
        log.success(`蝉道登录成功！`)
      } else {
        log.error(res.data.reason)
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  static login (account, password) {
    this.login(account, password)
  }

  getLoginForm (account, password) {
    const form = new FormData()
    form.append('account', account)
    form.append('password', password)
    return form
  }

  getSid (cookies) {
    const cookie = cookies.find(cookie => cookie.includes('zentaosid='))
    if (cookie) {
      return cookie.match(/(?<=zentaosid=)\w+/)[0]
    }
  }

  async getMyTaskList () {
    try {
      const { data } = await axios.get(`${this.requestUrl}my-task.json?zentaosid=${this.sid}`)
      return JSON.parse(data.data).tasks
    } catch (err) {
      console.log('err', err)
    }
  }

  
}

module.exports = ZenTao