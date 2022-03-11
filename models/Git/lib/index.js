const simpleGit = require('simple-git')
const log = require('@fftai/dai-cli-log')
const inquirer = require('inquirer')
const { getConfig, GIT_BASE_BRANCH } = require('@fftai/dai-cli-util-config')

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
    // 1. 检查目标分支是否存在
    const isExist = await this.isBranchExist(task)
    // 1.1 如果存在直接切过去
    if (isExist) {
      log.info('目标任务分支已存在，直接切换')
      await this.git.checkout([task])
      log.success('切换分支 ' + task + ' 成功')
    } else {
      log.info('正在更新基础分支')
      const checkoutBaseBranch = baseBranch || getConfig(GIT_BASE_BRANCH) || 'master'
      // 1.2 如果不存在更新 「基础」 分支后切换过去
      await this.git.checkout(checkoutBaseBranch)
      // 1.3 更新基础分支
      await this.pullNewCode(checkoutBaseBranch)
      // 1.4 检查是否有冲突
      const conflict = await this.git.checkConflict()
      log.info('更新基础分支完成')
      if (conflict) {
        log.error('出现冲突，请手动解决')
      }
      // 1.5 创建并切换到目标分支
      await this.git.checkoutBranch(task)
    }
  }

  async pullNewCode (branch) {
    const result = await this.git.pull('origin', branch)
    console.log('result', result)
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
    const changes = await this.git.diffSummary()
    if (changes.files.length > 0) {
      let confirm = false
      if (!yes) {
        const result = await inquirer.prompt({
          name: 'confirm',
          type: 'confirm',
          message: '当前存在未提交的文件，是否执行 commit 操作？',
          default: true,
        })
        confirm = result.confirm
      }
      if (confirm || yes) {
        await this.git.add(['.'])
        const { commitMessage } = await inquirer.prompt({ type: 'input', name: 'commitMessage', message: '请输入commit信息', default: 'WIP' })
        await this.git.commit(['-m', commitMessage])
        log.success('commit 成功')
      } else {
        throw new Error('中止操作')
      }
    }
  }
}

module.exports = Git