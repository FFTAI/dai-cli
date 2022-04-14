const simpleGit = require('simple-git')
const log = require('@fftai/dai-cli-log')
const inquirer = require('inquirer')
const { getConfig, GIT_BASE_BRANCH } = require('@fftai/dai-cli-util-config')
const colors = require('colors/safe')

const checkoutMessage = (str) => colors.bold(colors.cyan(str))

class Git {

  constructor () {
    this.git = simpleGit(process.cwd())
  }

  async prepareBranch (yes) {
    log.verbose('prepareBranch~')
    // 1. 确保当前分支是否可以切出去
    // 1.1 确认stash区是否要pop
    await this.checkStash(yes)
    // 1.2 检查所有文件是否提交
    await this.checkChanges(yes)
  }

  async checkoutTaskBranch (task, baseBranch) {
    log.info(checkoutMessage('------正在自动切换至开发分支------'))
    // 1. 检查目标分支是否存在
    const isExist = await this.isBranchExist(task)
    // 1.1 如果存在直接切过去
    if (isExist) {
      log.info('目标任务分支已存在，直接切换')
      await this.git.checkout([task])
    } else {
      const checkoutBaseBranch = this.getBaseBranch(baseBranch)
      // 1.2 如果不存在更新 「基础」 分支后切换过去
      log.info(`正在切换至基础分支 ${checkoutBaseBranch}`)
      await this.git.checkout(checkoutBaseBranch)
      log.info('正在更新基础分支')
      // 1.3 更新基础分支
      await this.pullNewCode(checkoutBaseBranch)
      log.info(`更新基础分支完成, ${checkoutBaseBranch} 分支已和远程同步`)
      // 1.4 检查是否有冲突
      await this.checkoutConflict()
      log.info(`未发现冲突，开始切换到任务分支 ${task}`)
      // 1.5 创建并切换到目标分支
      await this.git.checkoutBranch(task, checkoutBaseBranch)
    }
    log.info(checkoutMessage('------自动切换至开发分支成功------'))
    
    log.success(`您当前在 ${colors.bold(colors.cyan(`${task}`))} ${colors.magenta('分支。')}`)
  }

  getBaseBranch (baseBranch) {
    return baseBranch || getConfig(GIT_BASE_BRANCH) || 'master'
  }

  async checkoutConflict () {
    const diff = await this.git.diff(['--check'])
    const conflict = (this.git.conflicts && this.git.conflicts.length > 0) || (diff && diff.length > 0)
    log.verbose('git', this.git.conflicts)
    log.verbose('conflict', this.git.conflicts)
    if (conflict) {
      if (diff && diff.length) {
        log.info('diff', diff)
      }
      if (this.git.conflicts && this.git.conflicts.length) {
        log.info(this.git.conflicts)
      }
      throw new Error('出现冲突，请手动解决')
    }
  }

  async prepareBaseBranch (baseBranch) {
    log.info('正在下载基础分支...')
    const _baseBranch = this.getBaseBranch(baseBranch)
    log.verbose(_baseBranch, '_baseBranch')
    await this.git.fetch(['origin', _baseBranch])
    log.success('下载基础分支成功!')
    return _baseBranch
  }

  async getRepoInfo () {
    const url = await this.git.raw(['remote', 'get-url', 'origin'])
    return url.split('/').slice(-2).join('/')
  }

  async getCurrentBranch () {
    const branch = await this.git.branchLocal()
    return branch.current
  }

  async mergeBranch (mergeBranch) {
    log.info('正在合并分支...')
    await this.checkoutConflict()
    const currentBranch = await this.getCurrentBranch()
    log.verbose('mergeBranch', mergeBranch)
    log.verbose('currentBranch', currentBranch)
    await this.git.mergeFromTo(`origin/${mergeBranch}`, currentBranch)
    log.info('合并分支成功!')
  }

  async pushBranchWithSameName (branchName) {
    log.info(`正在推送 ${colors.cyan(branchName)} 分支...`)
    await this.git.push(['origin', `${branchName}:${branchName}`])
    log.info(`推送 ${colors.cyan(branchName)} 分支成功!`)
  }

  async checkoutBranch (branchName, checkoutBaseBranch) {
    await this.git.checkoutBranch(branchName, checkoutBaseBranch)
  }

  async pullNewCode (branch) {
    const result = await this.git.pull('origin', branch)
    return result
  }

  async isBranchExist (branch) {
    const branches = await this.git.branchLocal()
    return branches.all.includes(branch)
  }

  async checkStash (yes) {
    const stashList = await this.git.stashList()
    if (stashList.all.length > 0) {
      let confirm = false
      if (!yes) {
        const result = await inquirer.prompt({
          name: 'confirm',
          type: 'confirm',
          message: '当前存在stash区内存在文件，是否执行 pop 操作？',
          default: true,
        })
        confirm = result.confirm
      }
      if (confirm || yes) {
        await this.git.stash(['pop'])
        log.success('stash pop 成功')
      }
    }
  }

  async checkChanges (yes) {
    await this.checkoutConflict()
    const changes = await this.git.status()
    if (changes.files.length > 0) {
      let confirm = false
      if (!yes) {
        const { current: currentBranch } = await this.git.branchLocal()
        console.log(currentBranch)
        const result = await inquirer.prompt({
          name: 'confirm',
          type: 'confirm',
          message: `当前分支 ${colors.cyan(currentBranch)} 存在未提交的文件，是否执行 commit 操作？`,
          default: true,
        })
        confirm = result.confirm
      }
      if (confirm || yes) {
        await this.git.add(['-A'])
        const { commitMessage } = await inquirer.prompt({ type: 'input', name: 'commitMessage', message: '请输入commit信息', default: 'WIP' })
        await this.git.commit(commitMessage)
        log.success('commit 成功')
      } else {
        throw new Error('中止操作')
      }
    }
  }
}

module.exports = Git