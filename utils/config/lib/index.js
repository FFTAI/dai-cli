const { writeFile, readFile } = require('@fftai/dai-cli-file')
const fse = require('fs-extra')
const pathExists = require('path-exists').sync
const log = require('@fftai/dai-cli-log')
const inquirer = require('inquirer')
const constant = require('./contant')

const ZENTAO_REQUEST_URL = 'ZENTAO_REQUEST_URL'
const ZENTAO_SESSION_ID = 'ZENTAO_SESSION_ID'
const GIT_BASE_BRANCH = 'GIT_BASE_BRANCH'

const configList = [
  ZENTAO_REQUEST_URL,
  ZENTAO_SESSION_ID,
  GIT_BASE_BRANCH
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

module.exports = {
  constant,
  ZENTAO_REQUEST_URL,
  ZENTAO_SESSION_ID,
  GIT_BASE_BRANCH,
  configList,
  listConfig,
  setConfig,
  validateConfigName,
  getConfig,
  cleanConfig
}