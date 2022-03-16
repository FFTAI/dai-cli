const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')
const { setConfig, getConfig, ZENTAO_REQUEST_URL, ZENTAO_SESSION_ID } = require('@fftai/dai-cli-util-config')
const axios = require('axios')
const inquirer = require('inquirer')
const { getBaseInfo } = require('@fftai/dai-cli-util')
const dayjs = require('dayjs')
const colors = require('colors/safe')

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
      this.preLogin()
    }
  }

  async checkRequestUrl () {
    await checkRequestUrl()
    this.requestUrl = getConfig(ZENTAO_REQUEST_URL)
  }

  static async checkRequestUrl () {
    await checkRequestUrl()
  }

  async preLogin () {
    const { account, password } = await getBaseInfo()
    await this.login(account, password)
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

  async getMyTaskList () {
    let res
    try {
      const res = await axios.get(`${this.requestUrl}my-task.json?zentaosid=${this.sid}`)
      if (typeof res.data === 'string') {
        if (res.data.includes('/user-login')) {
          log.info('登录已过期，请重新登录')
          await this.preLogin()
          return await this.getMyTaskList()
        }
      } else {
        return JSON.parse(res.data.data).tasks
      }
    } catch (err) {
      log.info('出错了！')
      log.verbose(err)
    }
  }

  async startTask (taskId, { time, comment, action }) {
    let _time = time
    let _comment = comment
    const taskName = colors.bgYellow(`T#${taskId}`)
    if (!_time && action === 'start') {
      const result = await inquirer.prompt({
        type: 'input',
        name: 'time',
        message: '预估时间（小时）',
        default: 1
      })
      _time = result.time
    }
    if (!_comment) {
      const result = await inquirer.prompt({
        type: 'input',
        name: 'comment',
        message: '任务备注',
        default: ''
      })
      _comment = result.comment
    }
    const data = new FormData()
    if (action === 'start') {
      data.append('realStarted', dayjs().format('YYYY-MM-DD HH:mm:ss'))
      data.append('left', +_time)
    }
    data.append('comment', _comment)
    log.verbose(action)
    const res = await axios.post(`${this.requestUrl}task-${action}-${taskId}.json?zentaosid=${this.sid}&onlybody=yes`, data,  { headers: data.getHeaders() })
    if (typeof res.data === 'string' && res.data.includes(`parent.parent.$.cookie('selfClose', 1)`)) {
      log.success(`开始任务成功！您当前已在 ${taskName} 分支。`)
    }
  }
  
}

module.exports = ZenTao