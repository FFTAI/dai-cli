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
    .command('pause [name]')
    .option('-l, --list', '列出所有可以暂停的任务')
    .option('-m, --comment <comment>', '任务备注')
    .description('暂停一个任务')
    .action(pauseAction)
}

const { startsWith, statusMap, priorityMap } = ZenTao

async function pauseAction (name, { list, comment }) {
  const zentao = new ZenTao()
  await zentao.init()
  const tasks = await zentao.getMyTaskList()
  const taskList = Object.keys(tasks)
  if (taskList && taskList.length) {
    log.verbose('tasks', tasks)
    const task = await choosePauseTask(tasks)
    if (task) {
      await zentao.pauseTask(task.id, { comment })
    }
  }
}

async function choosePauseTask (tasks) {
  tasksList = Object.keys(tasks).map(key => tasks[key])
  doingTasksList = tasksList.filter(task => task.status === 'doing')
  let choices = doingTasksList
  if (!choices || !choices.length) {
    throw new Error('当前没有任务可以暂停')
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
    message: '选择一个想要暂停的任务',
    choices
  })
  return tasks[task]
}

function checkName (name) {
  if (!startsWith.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

module.exports = initStartCommand()