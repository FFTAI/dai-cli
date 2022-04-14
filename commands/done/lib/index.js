const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const Gitea = require('@fftai/dai-cli-models-gitea')
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
    message: `确认要提交 ${colors.cyan(name)} 分支的代码吗？`,
  })
  log.verbose(name, 'name')
  // 1. 校验是否以T#或者B#开头
  ZenTao.checkName(name)
  // 2. 检查当前分支是否可以切出去
  // 3. commit代码等
  await git.prepareBranch(yes)
  // 4. 更新base
  const baseBranch = await git.prepareBaseBranch(base)
  // 5. 合并分支
  await git.mergeBranch(baseBranch)
  // 6. push代码
  // await git.pushBranchWithSameName(name)
  // 7. gitea merge request
  const gitea = new Gitea()
  await gitea.init()
  await getTaskTitle(name)
}

async function getTaskTitle (name) {
  const zentao = new ZenTao()
  await zentao.init()
  const { task } = await zentao.getTaskInfo(ZenTao.getIdByName(name))
  log.info(task)
}

module.exports = initDoneCommand()