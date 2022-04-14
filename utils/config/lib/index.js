const { writeFile, readFile } = require('@fftai/dai-cli-file')
const fse = require('fs-extra')
const pathExists = require('path-exists').sync
const log = require('@fftai/dai-cli-log')
const inquirer = require('inquirer')
const constant = require('./contant')
const path = require('path')
const userHome = require('user-home')

const ZENTAO_REQUEST_URL = 'ZENTAO_REQUEST_URL'
const ZENTAO_SESSION_ID = 'ZENTAO_SESSION_ID'
const GITEA_REQUEST_URL = 'GITEA_REQUEST_URL'
const GITEA_USER_TOKEN = 'GITEA_USER_TOKEN'
const GITEA_USER_NAME = 'GITEA_USER_NAME'
const GIT_BASE_BRANCH = 'GIT_BASE_BRANCH'

const configList = [
  ZENTAO_REQUEST_URL,
  ZENTAO_SESSION_ID,
  GITEA_REQUEST_URL,
  GITEA_USER_TOKEN,
  GITEA_USER_NAME,
  GIT_BASE_BRANCH,
]

function listConfig () {
  const CLI_HOME_PATH = process.env.CLI_HOME_PATH

  fse.ensureDirSync(CLI_HOME_PATH)
  if (pathExists(CLI_HOME_PATH)) {
    configList.forEach(config => {
      log.info(config, getConfig(config))
    })
  }
}

function setConfig (name, value) {
  if (!validateConfigName(name)) {
    return
  }
  if (!writeFile(process.env[name], value)) {
    throw new Error(`写入配置${name}失败!`)
  }
}

async function cleanConfig () {
  const { confirm } = await inquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    message: '执行清空命令后，所有配置将会被清空，确定执行吗？',
    default: false,
  })
  if (!confirm) return
  configList.forEach(config => setConfig(config, ''))
  log.success('清空配置成功')
}

function validateConfigName (name) {
  if (!configList.includes(name)) {
    log.info('有效配置项', configList)
    throw new Error(`${name} 不是一个有效的配置项`)
  }
  return true
}

function getConfig (name) {
  let config
  const path = process.env[name]
  if (pathExists(path)) {
    config = readFile(path)
  }
  return config
}

function createDefaultConfig () {
  process.env.CLI_HOME_PATH = path.join(
    userHome,
    process.env.CLI_HOME ? process.env.CLI_HOME : constant.DEFAULT_CLI_HOME
  )
  configList.forEach(key => {
    process.env[key] = path.join(userHome, '.' + key.toLocaleLowerCase().replace(/_/g, '.'))
  })
}

module.exports = {
  constant,
  GITEA_REQUEST_URL,
  GITEA_USER_TOKEN,
  GITEA_USER_NAME,
  ZENTAO_REQUEST_URL,
  ZENTAO_SESSION_ID,
  GIT_BASE_BRANCH,
  configList,
  createDefaultConfig,
  listConfig,
  setConfig,
  validateConfigName,
  getConfig,
  cleanConfig
}