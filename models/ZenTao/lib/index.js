const log = require('@fftai/dai-cli-log')
const FormData = require('form-data')
const { setConfig, getConfig, ZENTAO_REQUEST_URL, ZENTAO_SESSION_ID } = require('@fftai/dai-cli-util-config')
const axios = require('axios')
const inquirer = require('inquirer')
const { getBaseInfo } = require('@fftai/dai-cli-util')
const dayjs = require('dayjs')
const colors = require('colors/safe')
const terminalLink = require('terminal-link')


const startsWith = ['T#', 'B#']

function checkName (name) {
  if (!startsWith.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

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
      await this.preLogin()
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

  async getTaskInfo (taskId) {
    try {
      const res = await axios.get(`${this.requestUrl}task-view-${taskId}.json?zentaosid=${this.sid}&onlybody=yes`)
      log.info('res', res.data)
      if (typeof res.data === 'string') {
        if (res.data.includes('/user-login')) {
          log.info('登录已过期，请重新登录')
          await this.preLogin()
          return await this.getTaskInfo(taskId)
        }
      }
      if (res.data && res.data.data) {
        log.verbose('data', JSON.parse(res.data.data))
        return JSON.parse(res.data.data)
      }
    } catch (err) {
      log.error('获取失败任务信息', err)
    }
  }

  async getMyTaskList () {
    try {
      const res = await axios.get(`${this.requestUrl}my-task.json?zentaosid=${this.sid}`)
      if (typeof res.data === 'string') {
        if (res.data.includes('/user-login')) {
          log.info('登录已过期，请重新登录')
          await this.preLogin()
          const list = await this.getMyTaskList()
          log.verbose('MyTaskList', list.data)
          return list
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
    const taskName = colors.bold(colors.cyan(`T#${taskId}`))
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
      log.success(`开始任务成功！${taskName}`)
    } else {
      try {
        const data = JSON.parse(res.data.data)
        if (data.bugIds && data.bugIds.length) {
          log.error(`开始任务失败！`)
          log.error(`当前有未解决的bug：${data.bugIds.map(id => `B#${id}`).join(',')}`)
          data.bugIds.forEach(id => {
            log.info(terminalLink(`B#${id}`, `${this.requestUrl}bug-view-${id}.html`))
          })
        }
      } catch (err) {
        log.error('开始任务失败！请在蝉道手动开始任务！')
      }
    }
  }

  async pauseTask (taskId, { comment }) {
    let _comment = comment
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
    data.append('comment', _comment)
    const res = await axios.post(`${this.requestUrl}task-pause-${taskId}.json?zentaosid=${this.sid}&onlybody=yes`, data,  { headers: data.getHeaders() })
    if (typeof res.data === 'string' && res.data.includes(`parent.parent.$.cookie('selfClose', 1)`)) {
      log.success(`暂停任务成功！`)
    } else {
      try {
        JSON.parse(res.data.data)
      } catch (err) {
        log.error('暂停任务失败！请在蝉道手动开始任务！')
        log.info(`${this.requestUrl}task-view-${taskId}.html`)
      }
    }
  }

  checkName = checkName

  static checkName = checkName

  static getIdByName (name) {
    this.checkName(name)
    return name.replace('T#', '').replace('B#', '')
  }

  static startsWith = startsWith

  static statusMap = {
    'pause': colors.brightYellow('暂停中'),
    'wait': colors.brightGreen('未开始'),
    'doing': colors.blue('进行中')
  }

  static priorityMap = {
    '1': colors.red.inverse('【高1】'),
    '2': colors.yellow.inverse('【中2】'),
    '3': colors.green.inverse('【常3】'),
    '4': colors.cyan.inverse('【低4】'),
    '5': colors.gray.inverse('【微5】')
  }
  
}


module.exports = ZenTao