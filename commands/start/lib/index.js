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
    .option('-sg, --skip-git-control', '只在禅道开始任务，跳过分支管理')
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
    const bugs = await zentao.getMyBugList('active')
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
      if (!tasks) {
        log.info('没有任务可以开始')
        return
      }
      const taskList = Object.keys(tasks)
      if (taskList && taskList.length) {
        log.verbose('tasks', tasks)
        const tasksList = Object.keys(tasks).map(key => tasks[key])
        const waitTasksList = tasksList.filter(task => task.status === 'wait')
        const pauseTasksList = tasksList.filter(task => task.status === 'pause')
        let choices = [...waitTasksList, ...pauseTasksList].filter(v => v)
        if (!choices || !choices.length) {
          log.info('没有任务可以开始')
          return
        }
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

async function confirmBug (zentao, bugId, bugInfo) {
  const { confirmBug } = await inquirer.prompt({
    name: 'confirmBug',
    type: 'confirm',
    message: `是否确认Bug ${colors.cyan(bugInfo.title)}，并开始修复？`,
    default: true,
  })
  if (confirmBug) {
    const { comment } = await inquirer.prompt({
      type: 'input',
      name: 'comment',
      message: '备注',
      default: '',
    })
    try {
      await zentao.confirmBug(bugId, comment)
      return true
    } catch (err) {
      return false
    }
  } else {
    log.warn('请在确认后再开始修复Bug')
    return false
  }
}

async function startBug (zentao, name, { skipGitControl, yes, base }) {
  const bugId = ZenTao.getIdByName(name)
  const data = await zentao.getBugInfo(bugId)
  log.verbose('bugInfo', data)
  if (data && data.title) {
    // 开始 bug 逻辑
    // 如果没有确认bug，则询问是否在茶道查看详情
    if (data.bug.confirmed === '0') {
      log.info(`${colors.cyan(data.title)} 尚未确认，请确认后再修复`)
      // 是否在蝉道查看bug详情
      const { useManualCheck } = await inquirer.prompt({
        name: 'useManualCheck',
        type: 'confirm',
        message: `开始修复 ${colors.cyan(data.title)}，是否在禅道确认${colors.green('详细信息')} ？`,
        default: true,
      })
      let isManualCheck = false
      if (useManualCheck) {
        open(`${getConfig(ZENTAO_REQUEST_URL)}bug-view-${bugId}.html`)
        // 查看详情后确认是否在蝉道中确认 BUG
        const result = await inquirer.prompt({
          name: 'isManualCheck',
          type: 'confirm',
          message: `是否已在蝉道中确认Bug ${colors.cyan(data.title)} ？`,
          default: true,
        })
        isManualCheck = result.isManualCheck
      }
      // 查看详情
      if (!useManualCheck || !isManualCheck) {
        const isConfirm = await confirmBug(zentao, bugId, data)
        if (!isConfirm) {
          return
        }
      }
    }
    // 如果bug的状态是已确认，就直接开始bug
    log.success('Bug 已确认，正在开始修复')
    if (!skipGitControl) {
      await checkoutDevBranch(name, { yes, base })
    }
  } else {
    log.info('没有在禅道上查询到该bug，请确认是否是正确的bug号')
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