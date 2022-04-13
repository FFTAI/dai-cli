const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const inquirer = require('inquirer')
const colors = require('colors/safe')
const terminalLink = require('terminal-link')
const { getConfig, ZENTAO_REQUEST_URL } = require('@fftai/dai-cli-util-config')

function initDoneCommand () {
  return program
    .command('done')
    .option('-y, --yes', '同意所有自动操作')
    .option('-b, --base <branchName>', '设置基础分支名称')
    .description('完成一个任务')
    .action(doneAction)
}

const { donesWith, statusMap, priorityMap } = ZenTao

async function doneAction ({ yes, base }) {
  prepare({ yes, base })
}

async function prepare ({ yes, base }) {
  const git = new Git()
  const name = await git.getCurrentBranch()
  await inquirer.prompt({
    type: 'confirm',
    name: 'task',
    message: `确认要提交 ${colors.blue(name)} 分支的代码吗？`,
  })
  log.verbose(name, 'name')
  // 1. 校验是否以T#或者B#开头
  ZenTao.checkName(name)
  // 2. 检查当前分支是否可以切出去
  // 3. commit代码等
  await git.prepareBranch(yes)
  // 4. 更新base
  await git.prepareBaseBranch(base)
  // 5. 合并分支
  await git.mergeBranch(base)
  // 6. push代码
  await git.pushBranchWithSameName(name)
}

async function chooseDoneTask (tasks) {
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

module.exports = initDoneCommand()