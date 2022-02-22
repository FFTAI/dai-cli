const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')
const { setConfig, getConfig, ZENTAO_REQUEST_URL, ZENTAO_SESSION_ID } = require('@fftai/dai-cli-util-config')
const axios = require('axios')

class ZenTao {
  constructor () {
    this.requestUrl = getConfig(ZENTAO_REQUEST_URL)
    this.sid = getConfig(ZENTAO_SESSION_ID)
  }

  async login (account, password) {
    const loginForm = this.getLoginForm(account, password)
    const requestUrl = `${this.requestUrl}user-login.json`
    log.verbose('loginRequestUrl', requestUrl)
    try {
      const res = await axios.post(requestUrl, loginForm, { headers: loginForm.getHeaders() })
      const sid = this.getSid(res.headers['set-cookie'])
      setConfig(ZENTAO_SESSION_ID, sid)
      this.sid = sid
      log.success(`蝉道登录成功！`)
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

  listMyTask (link, sid) {
    try {
      const { data } = await axios.get(`${link}my-task.json?zentaosid=${sid}`)
      console.log(JSON.parse(data.data).tasks)
    } catch (err) {
      console.log('data', data)
    }
  }

  
}

module.exports = ZenTao