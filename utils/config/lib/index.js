const { writeFile, readFile } = require('@fftai/dai-cli-file')
const fse = require('fs-extra')
const pathExists = require('path-exists').sync
const log = require('@fftai/dai-cli-log')

const ZENTAO_REQUEST_URL = 'ZENTAO_REQUEST_URL'
const ZENTAO_SESSION_ID = 'ZENTAO_SESSION_ID'

const configList = [
  ZENTAO_REQUEST_URL,
  ZENTAO_SESSION_ID
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
  console.log(process.env[name])
  if (writeFile(process.env[name], value)) {
    log.success(`写入配置成功 ${name}=${value}`)
  } else {
    throw new Error('写入配置失败')
  }
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
  ZENTAO_REQUEST_URL,
  ZENTAO_SESSION_ID,
  configList,
  listConfig,
  setConfig,
  validateConfigName,
  getConfig
}