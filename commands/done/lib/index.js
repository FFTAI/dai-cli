const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-git')
const ZenTao = require('@fftai/dai-cli-models-zentao')
const Gitea = require('@fftai/dai-cli-models-gitea')
const inquirer = require('inquirer')
const colors = require('colors/safe')
// const terminalLink = require('terminal-link')
// const { getConfig, ZENTAO_REQUEST_URL, listConfig } = require('@fftai/dai-cli-util-config')

function initDoneCommand () {
  return program
    .command('done')
    .option('-y, --yes', '同意所有自动操作。[1. 自动把 stash 区的文件 pop 出来, 2. commit 所有文件]')
    .option('-b, --base <branchName>', '设置基础分支名称')
    .option('-spr, --skip-pull-request', '跳过创建 pull request')
    .description('完成一个任务')
    .action(doneAction)
}

async function doneAction ({ yes, base, skipPullRequest }) {
  prepare({ yes, base, skipPullRequest })
}

async function prepare ({ yes, base, skipPullRequest }) {
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
  // 1.1 获取任务标题
  const title = await getCurrentTitle(name)
  log.verbose('title', title)
  // 2. 检查当前分支是否可以切出去
  // 3. commit代码等
  await git.prepareBranch(yes, { defaultCommitMessage: title })
  // 4. 更新base
  const baseBranch = await git.prepareBaseBranch(base)
  // 5. 合并分支
  await git.mergeBranch(baseBranch)
  // 6. push代码
  await git.pushBranchWithSameName(name)
  // 7. gitea merge request
  const gitea = new Gitea()
  await gitea.init()
  const repo = await git.getRepoInfo(['get-url', 'origin'])
  log.verbose('repo', repo)
  if (skipPullRequest) {
    log.info('跳过创建 pull request')
    return
  }
  try {
    log.info('正在创建合并请求，需要花一些时间，请稍候...')
    const { html_url } = await gitea.createPullRequest({
      repo,
      baseBranch,
      title,
      currentBranch: name
    })
    log.success('创建合并请求成功！')
    log.info('地址', colors.underline(colors.green(html_url)))
    log.info('review 地址', colors.underline(colors.green(html_url + '/files')))
  } catch (err) {
    if (err.response.status === 409) {
      log.warn(colors.cyan('这条分支已经提交过 pull request 了'))
      const id = err.response.data.message.match(/(?<=issue_id: )\d+/)
      const pull_request_url = err.response.data.url.replace('api/swagger', '') + repo + '/pulls/' + id
      log.info('地址', colors.underline(colors.green(`${pull_request_url}`)))
      log.info('review 地址', colors.underline(colors.green(pull_request_url + '/files')))
    } else {
      log.error('error!', err)
      log.error('创建合并请求失败，请手动创建')
    }
    return
  }
}

async function getCurrentTitle (name) {
  async function getInputTitle () {
    const { title } = await inquirer.prompt({
      type: 'input',
      name: 'title',
      message: '从蝉道获取 title 失败，请手动输入 title',
      default: '',
      validate: function (input)  {
        const done = this.async()
        setTimeout(function () {
          if (!input) {
            done(`手动输入Title.`)
          }
          done(null, true)
        }, 0)
      }
    })
    return title
  }
  const zentao = new ZenTao()
  await zentao.init()
  log.verbose('name', name)
  try {
    let action
    if (name.startsWith('T#')) {
      action = zentao.getTaskInfo.bind(zentao)
    } else if (name.startsWith('B#')) {
      action = zentao.getBugInfo.bind(zentao)
    } else {
      throw new Error('未知的任务类型')
    }
    const data = await action(ZenTao.getIdByName(name))
    log.verbose('task', data)
    if (data.title) {
      return data.title
    } else {
      return await getInputTitle()
    }
  } catch (err) {
    return await getInputTitle()
  }
}



module.exports = initDoneCommand()