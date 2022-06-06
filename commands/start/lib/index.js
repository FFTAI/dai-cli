const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const inquirer = require('inquirer')
const colors = require('colors/safe')
const terminalLink = require('terminal-link')
const { getConfig, ZENTAO_REQUEST_URL } = require('@fftai/dai-cli-util-config')
const open = require('open')

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

const { statusMap, priorityMap } = ZenTao

async function startAction (name, { yes, base, time, comment, skipGitControl }) {
  const zentao = new ZenTao()
  await zentao.init()
  // 通过指定名称开始任务
  if (name) {
    if (name.startsWith('T#')) {
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
    } else if (name.startsWith('B#')) {
      startBug(zentao, name, { skipGitControl, yes, base })
      return
    }
  } else {
    // 直接开始任务
    const bugs = await zentao.getMyBugList()
    // 如果有bug先修bug
    if (bugs && bugs.length) {
      log.info('发现有未解决的bug，请先修复bug！')
      log.verbose('bugs', bugs)
      const bug = await chooseStartTask(bugs, 'bug', '选择想要修复的bug')
      log.verbose('choosedBug', bug)
      startBug(zentao, `B#${bug.id}`, { skipGitControl, yes, base })
    } else {
      // 如果没bug，开始任务
      const tasks = await zentao.getMyTaskList()
      const taskList = Object.keys(tasks)
      if (taskList && taskList.length) {
        log.verbose('tasks', tasks)
        const tasksList = Object.keys(tasks).map(key => tasks[key])
        const waitTasksList = tasksList.filter(task => task.status === 'wait')
        const pauseTasksList = tasksList.filter(task => task.status === 'pause')
        let choices = [...waitTasksList, ...pauseTasksList]
        const task = await chooseStartTask(choices, 'task')
        if (task) {
          const action = task.status === 'pause' ? 'restart' : 'start'
          if (!skipGitControl) {
            await checkoutDevBranch(`T#${task.id}`, { yes, base })
          }
          await zentao.startTask(task.id, { time, comment, action })
        }
      } else {
        log.info('没有任务可以开始')
      }
    }
  }
}

async function startBug (zentao, name, { skipGitControl, yes, base }) {
  const data = await zentao.getBugInfo(ZenTao.getIdByName(name))
  log.verbose('bugInfo', data)
  if (data && data.title) {
    const { confirm } = await inquirer.prompt({
      name: 'confirm',
      type: 'confirm',
      message: `开始修复 ${colors.cyan(data.title)}，是否在蝉道查看${colors.green('详细信息')}？`,
      default: true,
    })
    if (confirm) {
      open(`${getConfig(ZENTAO_REQUEST_URL)}bug-view-${ZenTao.getIdByName(name)}.html`)
    }
    if (!skipGitControl) {
      await checkoutDevBranch(name, { yes, base })
    }
  } else {
    log.info('没有在蝉道上查询到该bug，请确认是否是正确的bug号')
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

async function chooseStartTask (choices, type, message = '选择一个想要开始的任务') {
  if (!choices || !choices.length) {
    log.info('当前没有任务可以开始')
    return
  }
  choices.sort((a, b) => a.pri - b.pri)
  const _choices = choices.map(task => {
    const prefix = type === 'task' ? 'T#' : 'B#'
    const name = `${priorityMap[task.pri]} ${colors.bold(`${prefix}${task.id}`)} ${statusMap[task.status]} ${type === 'task' ? task.name : task.title}`
    const link = `${getConfig(ZENTAO_REQUEST_URL)}${type}-view-${task.id}.html`
    return {
      name: terminalLink(name, link),
      value: task.id,
      short: name,
    }
  })
  const { task } = await inquirer.prompt({
    type: 'list',
    name: 'task',
    message,
    choices: _choices
  })
  log.verbose('choices', choices)
  log.verbose('task', task)
  return choices.find(item => item.id === task)
}

// async function chooseStartBug () {

// }

module.exports = initStartCommand()