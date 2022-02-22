const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')
const { setConfig, getConfig, ZENTAO_REQUEST_URL, ZENTAO_SESSION_ID } = require('@fftai/dai-cli-util-config')
const axios = require('axios')

class ZenTao {
  constructor () {
    this.requestUrl = getConfig(ZENTAO_REQUEST_URL)
    if (!this.requestUrl) {
      log.info(`设置蝉道 requestUrl 命令：dai config set -n ZENTAO_REQUEST_URL -v 当前蝉道地址`)
      log.info(`例如：dai config set -n ZENTAO_REQUEST_URL -v http://192.168.8.250:81/zentao/`)
      throw new Error('蝉道 requestUrl 未设置')
    }
    this.sid = getConfig(ZENTAO_SESSION_ID)
  }

  static checkRequestUrl () {
    const requestUrl = getConfig(ZENTAO_REQUEST_URL)
    if (!requestUrl) {
      log.warn(`蝉道 requestUrl 未设置`)
      log.warn(`设置蝉道requestUrl命令：dai config -n ZENTAO_REQUEST_URL -v 当前蝉道地址`)
      log.warn(`例如：dai config -n ZENTAO_REQUEST_URL -v http://192.168.8.250:81/zentao/`)
      throw new Error('蝉道 requestUrl 未设置')
    }
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

  async listMyTask (link, sid) {
    try {
      const { data } = await axios.get(`${link}my-task.json?zentaosid=${sid}`)
      console.log(JSON.parse(data.data).tasks)
    } catch (err) {
      console.log('data', data)
    }
  }

  
}

module.exports = ZenTao