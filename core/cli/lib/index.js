module.exports = core;

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const commander = require('commander')
const log = require('@fftai/dai-cli-log')

const constant = require('./const')
const pkg = require('../package.json')

const program = new commander.Command()
const start = require('@fftai/dai-cli-command-start')
const login = require('@fftai/dai-cli-command-login')
let args, config;

async function core() {
  try {
    await prepare()
    // 注册命令
    registerCommand()
  } catch (e) {
    log.error(colors.red(e.message))
    if (program.debug) {
      console.log(e)
    }
  }
}

async function prepare() {
    // 检查当前版本是否为最新
    checkGlobalUpdate()
    // 输出版本号
    checkPkgVersion()
    // 检查node版本
    checkNodeVersion()
    // 检查是否为root，如果是root需要进行降权。因为root创建的文件普通用户不可读不可写
    checkRoot()
    // 检查用户主目录
    checkUserHome()
    // 检查入参
    checkInputArgs()
    // 检查环境变量
    checkENV()
}

function checkPkgVersion() {
  log.info('cli', pkg.version)
}

function checkNodeVersion () {
  const nodeVersion = process.version
  const LOWEST_NODE_VERSION = constant.LOWEST_NODE_VERSION
  if (semver.gt(LOWEST_NODE_VERSION, nodeVersion)) {
    throw new Error(`当前node版本为 ${nodeVersion}，请升级至 v${LOWEST_NODE_VERSION} 以上版本`)
  }
}

function createDefaultConfig() {
  process.env.CLI_HOME_PATH = path.join(
    userHome,
    process.env.CLI_HOME ? process.env.CLI_HOME : constant.DEFAULT_CLI_HOME
  )
}

function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error('当前用户主目录不存在！')
  }
}

function checkENV() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    // 获取 env 中的环境变量
    config = dotenv.config({
      path: dotenvPath
    })
  }
  createDefaultConfig()
  log.verbose('环境变量', config)
  log.verbose('CLI_HOME_PATH', process.env.CLI_HOME_PATH)
}

function checkInputArgs () {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  log.verbose('入参', args)
  checkArgs()
}

function checkArgs () {
  if (args.debug || args.d) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

async function checkGlobalUpdate() {
  // 获取当前版本号
  const currentVersion = pkg.version
  const pkgName = pkg.name

  const {
    getNpmSemverVersion
  } = require('@fftai/dai-cli-get-npm-info')
  const lastVersion = await getNpmSemverVersion(currentVersion, pkgName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.notice(colors.yellow(`${pkgName} 最新版本已就绪`))
    log.notice(colors.yellow(`当前版本：${currentVersion}`))
    log.notice(colors.yellow(`最新版本：${lastVersion}`))
    log.notice(`更新命令：npm install -g ${pkgName}`)
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .usage('<cmd> [options]')
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-e, --env <env>', '获取环境变量')
    // .action(exec)

  program
    .command('start [name]')
    .description('开始一个任务或者修复一个bug')
    .action(start)

  program
    .command('login [system]')
    .description('登录某个系统')
    .action(login)
  
  // 监听debug
  program.on('option:debug', function () {
    if (program.debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
    log.verbose('debug mode enable')
  })
  
  // 监听targetPath
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = program.targetPath
  })

  // 对未知命令的监听
  program.on('command:*', function (arg) {
    const availableCommands = program.commands.map(cmd => cmd.name())
    console.error(colors.red(`未知的命令：${arg[0]}`))
    availableCommands.length && console.error(colors.red(`可用命令：${availableCommands.join(',')}`))
  })

  // 先解析命令
  program.parse(process.argv)

  // 发现 args 为空 则弹出提示
  if (program.args && program.args.length < 1) {
    program.outputHelp()
  }
}