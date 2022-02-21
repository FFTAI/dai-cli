'use strict';

const startsWidth = [
  'T#',
  'B#'
]

function startAction (name) {
  if (name) {
    // 1. 校验是否以T#或者B#开头
    checkName(name)
    // 2. 校验是否存在
    console.log('校验是否存在')
  } else {
    console.log('列出任务列表')
  }
}

function checkName (name) {
  if (!startsWidth.includes(name.substr(0, 2))) {
    throw new Error('<name> 必须以T#或者B#开头')
  }
}

module.exports = startAction