const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const inquirer = require('inquirer')
const colors = require('colors/safe')

function initStartCommand () {
  return program
    .command('start [name]')
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

async function startAction (name) {
  if (name) {
    log.info('haha')
    // 1. 校验是否以T#或者B#开头
    checkName(name)
    // 2. 检查当前分支是否可以切出去
    const git = new Git()
    // 3. 校验是否存在
    // 4. 
  } else {
    const zentao = new ZenTao()
    await zentao.init()
    const tasks = await zentao.getMyTaskList()
    tasksList = Object.keys(tasks).map(key => tasks[key])
    waitTasksList = tasksList.filter(task => task.status === 'wait')
    pauseTasksList = tasksList.filter(task => task.status === 'pause')
    const { task } = await inquirer.prompt({
      type: 'list',
      name: 'task',
      message: '选择一个想要开始的任务',
      choices: [...waitTasksList, ...pauseTasksList].map(task => ({
        name: `${statusMap[task.status]} ${colors.bold(`T#${task.id}`)} ${task.name} `,
      }))
    })
    log.info('TODO：', 'GIT操作 检查分支 拉取代码等')
    log.info('TODO：', `开始任务 ${task}`)
  }
}

function checkName (name) {
  if (!startsWidth.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

module.exports = initStartCommand()