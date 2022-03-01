const simpleGit = require('simple-git')
const log = require('@fftai/dai-cli-log')
const inquirer = require('inquirer')

class Git {

  constructor () {
    this.git = simpleGit(process.cwd())
    this.prepareBranch()
  }

  async prepareBranch () {
    log.info('prepareBranch~')
    // 1. 检查当前分支是否有代码
    await this.checkStash()
    // 2. 切换到 基础 分支
    // 3. 从基础分支上切到开发分支
  }

  async checkStash () {
    const stashList = await this.git.stashList()
    if (stashList.all.length > 0) {
      const { confirm } = await inquirer.prompt({
        name: 'confirm',
        type: 'confirm',
        message: '当前存在stash，是否执行 pop 操作？',
        default: true,
      })
      if (confirm) {
        await this.git.stash(['pop'])
        log.success('stash pop 成功')
      }
    }
  }
}

module.exports = Git