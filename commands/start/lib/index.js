const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const inquirer = require('inquirer')
const colors = require('colors/safe')
const terminalLink = require('terminal-link')
const { getConfig, ZENTAO_REQUEST_URL } = require('@fftai/dai-cli-util-config')

function initStartCommand () {
  return program
    .command('start [name]')
    .option('-y, --yes', '同意所有自动操作。[1. 自动把 stash 区的文件 pop 出来, 2. commit 所有文件]')
    .option('-b, --base <branchName>', '设置基础分支名称')
    .description('开始一个任务或者修复一个bug')
    .action(startAction)
}

const startsWidth = [
  'T#',
  'B#'
]

const statusMap = {
  'pause': colors.yellow('暂停中'),
  'wait': colors.green('未开始')
}

async function startAction (name, { yes, base }) {
  if (name) {
    // 1. 校验是否以T#或者B#开头
    checkName(name)
    // 2. 检查当前分支是否可以切出去
    const git = new Git()
    await git.prepareBranch(yes)
    // 3. 切换到任务分支
    await git.checkoutTaskBranch(name, base)
  } else {
    const zentao = new ZenTao()
    await zentao.init()
    const tasks = await zentao.getMyTaskList()
    if (tasks) {
      tasksList = Object.keys(tasks).map(key => tasks[key])
      waitTasksList = tasksList.filter(task => task.status === 'wait')
      pauseTasksList = tasksList.filter(task => task.status === 'pause')
      const requestUrl = getConfig(ZENTAO_REQUEST_URL)
      const choices = [...waitTasksList, ...pauseTasksList].map(task => {
        const name = terminalLink(`${statusMap[task.status]} ${colors.bold(`T#${task.id}`)} ${task.name}`, `${requestUrl}task-view-${task.id}.html`)
        return {
          name
        }
      })
      const { task } = await inquirer.prompt({
        type: 'list',
        name: 'task',
        message: '选择一个想要开始的任务',
        choices
      })
      log.info('TODO：', 'GIT操作 检查分支 拉取代码等')
      log.info('TODO：', `开始任务 ${task}`)
    }
  }
}

function checkName (name) {
  if (!startsWidth.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

module.exports = initStartCommand()