const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const Gitea = require('@fftai/dai-cli-models-gitea')
const inquirer = require('inquirer')
const colors = require('colors/safe')
const terminalLink = require('terminal-link')
const { getConfig, ZENTAO_REQUEST_URL, listConfig } = require('@fftai/dai-cli-util-config')

function initDoneCommand () {
  return program
    .command('done')
    .option('-y, --yes', '同意所有自动操作。[1. 自动把 stash 区的文件 pop 出来, 2. commit 所有文件]')
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
  if (!yes) {
    await inquirer.prompt({
      type: 'confirm',
      name: 'task',
      message: `确认要提交 ${colors.cyan(name)} 分支的代码吗？`,
    })
  }
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
  await git.pushBranchWithSameName(name)
  // 7. gitea merge request
  const gitea = new Gitea()
  await gitea.init()
  const title = await getTaskTitle(name)
  log.verbose('title', title)
  const repo = await git.getRepoInfo(['get-url', 'origin'])
  log.verbose('repo', repo)
  try {
    log.info('正在创建合并请求，需要花一些时间，请稍候...')
    await gitea.createPullRequest({
      repo,
      baseBranch,
      title,
      currentBranch: name
    })
  } catch (err) {
    log.error(err)
    log.error('创建合并请求失败，请手动创建')
    return
  }
  log.success('创建合并请求成功！')
}

async function getTaskTitle (name) {
  async function getInputTitle () {
    const { title } = await inquirer.prompt({
      type: 'input',
      name: 'title',
      message: '从蝉道获取 title 失败，请手动输入 title',
      default: '',
      validate: function (input)  {
        const done = this.async();
        setTimeout(function () {
          if (!input) {
            done(`手动输入Title`);
          }
          done(null, true);
        }, 0);
      }
    })
    return title
  }
  const zentao = new ZenTao()
  await zentao.init()
  log.verbose('name', name)
  try {
    const task = await zentao.getTaskInfo(ZenTao.getIdByName(name))
    if (task.title) {
      return task.title
    } else {
      return await getInputTitle()
    }
  } catch (err) {
    return await getInputTitle()
  }
}

module.exports = initDoneCommand()