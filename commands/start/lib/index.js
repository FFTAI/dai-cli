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
    .option('-sg, --skip-git-control', '只在蝉道开始任务，跳过分支管理')
    .description('开始一个任务')
    .action(startAction)
}

const { startsWith, statusMap, priorityMap } = ZenTao

async function startAction (name, { yes, base, time, comment, skipGitControl }) {
  const zentao = new ZenTao()
  await zentao.init()
  if (name) {
    if (!skipGitControl) {
      await checkoutDevBranch(name, { yes, base })
    }
    const { task } = await zentao.getTaskInfo(ZenTao.getIdByName(name))
    if (task.status === 'doing') {
      throw new Error('该任务已经处于进行中状态')
    } else {
      const action = task.status === 'pause' ? 'restart' : 'start'
      await zentao.startTask(ZenTao.getIdByName(name), { time, comment, action })
    }
  } else {
    const tasks = await zentao.getMyTaskList()
    const taskList = Object.keys(tasks)
    if (taskList && taskList.length) {
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
  ZenTao.checkName(name)
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
  if (!choices || !choices.length) {
    throw new Error('当前没有任务可以开始')
  }
  choices.sort((a, b) => a.pri - b.pri)
  choices = choices.map(task => {
    const name = `${priorityMap[task.pri]} ${colors.bold(`T#${task.id}`)} ${statusMap[task.status]} ${task.name}`
    const link = `${getConfig(ZENTAO_REQUEST_URL)}task-view-${task.id}.html`
    return {
      name: terminalLink(name, link),
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

module.exports = initStartCommand()