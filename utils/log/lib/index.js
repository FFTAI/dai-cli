const log = require('npmlog')

// 判断 debugger 模式
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'

log.heading = 'Dai' // 修改前缀

// 添加自定义
log.addLevel('success', 2000, {fg: 'green', bold: true})

module.exports = log