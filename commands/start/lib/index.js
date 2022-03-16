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
    .option('-t, --time <hour>', '预估时间')
    .option('-m, --comment <comment>', '任务备注')
    .description('开始一个任务或者修复一个bug')
    .action(startAction)
}

const startsWidth = [
  'T#',
  'B#'
]

const statusMap = {
  'pause': colors.brightYellow('暂停中'),
  'wait': colors.brightGreen('未开始')
}

const priorityMap = {
  '1': colors.red.inverse('【高1】'),
  '2': colors.yellow.inverse('【中2】'),
  '3': colors.green.inverse('【常3】'),
  '4': colors.cyan.inverse('【低4】'),
  '5': colors.gray.inverse('【微5】')
}

async function startAction (name, { yes, base, time, comment }) {
  if (name) {
    checkoutDevBranch(name, { yes, base })
  } else {
    const zentao = new ZenTao()
    await zentao.init()
    const tasks = await zentao.getMyTaskList()
    if (tasks) {
      log.verbose('tasks', tasks)
      const task = await chooseStartTask(tasks)
      const action = task.status === 'pause' ? 'restart' : 'start'
      await checkoutDevBranch(`T#${task.id}`, { yes, base })
      await zentao.startTask(task.id, { time, comment, action })
    }
  }
}

async function checkoutDevBranch (name, { yes, base }) {
  // 1. 校验是否以T#或者B#开头
  checkName(name)
  // 2. 检查当前分支是否可以切出去
  const git = new Git()
  await git.prepareBranch(yes)
  // 3. 切换到任务分支
  await git.checkoutTaskBranch(name, base)
}

async function chooseStartTask (tasks) {
  tasksList = Object.keys(tasks).map(key => tasks[key])
  waitTasksList = tasksList.filter(task => task.status === 'wait')
  pauseTasksList = tasksList.filter(task => task.status === 'pause')
  let choices = [...waitTasksList, ...pauseTasksList]
  choices.sort((a, b) => a.pri - b.pri)
  choices = choices.map(task => {
    const name = `${priorityMap[task.pri]} ${colors.bold(`T#${task.id}`)} ${statusMap[task.status]} ${task.name}`
    return {
      name,
      value: task.id,
      short: name,
    }
  })
  const { task } = await inquirer.prompt({
    type: 'list',
    name: 'task',
    message: '选择一个想要开始的任务',
    choices
  })
  return tasks[task]
}

function checkName (name) {
  if (!startsWidth.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

module.exports = initStartCommand()