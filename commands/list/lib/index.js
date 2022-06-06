const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const inquirer = require('inquirer')
const colors = require('colors/safe')
const terminalLink = require('terminal-link')
const { getConfig, ZENTAO_REQUEST_URL } = require('@fftai/dai-cli-util-config')
const open = require('open')

function initListCommand () {
  return program
    .command('list [type]')
    .description('查看我的 任务/BUG, [type] 取值为 task, bug')
    .action(listAction)
}

const { statusMap, priorityMap } = ZenTao

async function listAction (type) {
  const zentao = new ZenTao()
  await zentao.init()
  if (!type || type === 'bug') {
    log.info('列出bug...')
    // 查询所有bug
    const bugs = await zentao.getMyBugList()
    if (bugs && bugs.length) {
      log.verbose('bugs', bugs)
      const bug = await chooseListTask(bugs, 'bug', '选择想要修复的bug')
      open(`${getConfig(ZENTAO_REQUEST_URL)}bug-view-${bug.id}.html`)
      return
    } else {
      log.info('当前没有bug')
    }
  }
  if (!type || type === 'task') {
    log.info('列出任务...')
    const tasks = await zentao.getMyTaskList()
    const taskList = Object.keys(tasks)
    if (taskList && taskList.length) {
      log.verbose('tasks', tasks)
      const tasksList = Object.keys(tasks).map(key => tasks[key])
      const task = await chooseListTask(tasksList, 'task')
      open(`${getConfig(ZENTAO_REQUEST_URL)}task-view-${task.id}.html`)
    } else {
      log.info('当前没有任务')
    }
  }
}

async function chooseListTask (choices, type) {
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
    message: '选择想要查看详情的任务/BUG',
    choices: _choices
  })
  log.verbose('choices', choices)
  log.verbose('task', task)
  return choices.find(item => item.id === task)
}

module.exports = initListCommand()