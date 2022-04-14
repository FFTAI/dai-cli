const log = require('@fftai/dai-cli-log')
const { setConfig, getConfig, GITEA_USER_TOKEN, GITEA_USER_NAME, GITEA_REQUEST_URL } = require('@fftai/dai-cli-util-config')
const axios = require('axios')
const inquirer = require('inquirer')
const { getBaseInfo } = require('@fftai/dai-cli-util')
const dayjs = require('dayjs')
const colors = require('colors/safe')

async function checkRequestUrl () {
  const requestUrl = getConfig(GITEA_REQUEST_URL)
  if (!requestUrl) {
    log.warn(`Gitea requestUrl 未设置`)
    const { requestUrl } = await inquirer.prompt({
      type: 'input',
      name: 'requestUrl',
      message: '请输入蝉道地址，格式：http://127.0.0.1:88/',
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
    setConfig(GITEA_REQUEST_URL, requestUrl)
  }
}

class Gitea {
  constructor () {
    this.name = getConfig(GITEA_USER_TOKEN)
    this.token = getConfig(GITEA_USER_NAME)
    this.requestUrl = getConfig(GITEA_REQUEST_URL)
  }

  async init () {
    console.log(1)
    await this.checkName()
    console.log(1)
    await this.checkToken()
    console.log(1)
    await this.checkRequestUrl()
  }

  async checkName () {
    const name = getConfig(GITEA_USER_NAME)
    if (!name) {
      const { name } = await inquirer.prompt({
        type: 'input',
        name: 'name',
        message: '请输入Gitea用户名',
        default: '',
        validate: function (input)  {
          const done = this.async();
          setTimeout(function () {
            if (!input) {
              done(`请输入Gitea用户名`);
            }
            done(null, true);
          }, 0);
        }
      })
    }
    this.name = name
    setConfig(GITEA_USER_NAME, name)
  }

  async checkToken () {
    const token = getConfig(GITEA_USER_TOKEN)
    if (!token) {
      log.warn(`Gitea token 未设置`)
      const { token } = await inquirer.prompt({
        type: 'input',
        name: 'token',
        message: '请输入Gitea token, 可以在 设置 -> 应用 -> 管理Access Tokens 生成你的 token',
        default: '',
        validate: function (input)  {
          const done = this.async();
          setTimeout(function () {
            if (!input) {
              done(`请输入Gitea token`);
            }
            done(null, true);
          }, 0);
        }
      })
    }
    this.token = token
    setConfig(GITEA_USER_TOKEN, token)
  }

  async checkRequestUrl () {
    await checkRequestUrl()
    this.requestUrl = getConfig(GITEA_REQUEST_URL)
  }
  
}


module.exports = Gitea