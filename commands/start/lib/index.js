const commander = require('commander')
const program = new commander.Command()
const log = require('@fftai/dai-cli-log')
const Git = require('@fftai/dai-cli-models-zentao')

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

function startAction (name) {
  if (name) {
    // 1. 校验是否以T#或者B#开头
    checkName(name)
    // 2. 检查当前分支是否可以切出去
    // 3. 校验是否存在
    // 4. 
  } else {
    console.log('列出任务列表')
  }
}

function checkName (name) {
  if (!startsWidth.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

module.exports = initStartCommand()