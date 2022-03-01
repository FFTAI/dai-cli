const inquirer = require('inquirer')

const usernamePrompt = {
  type: 'input',
  name: 'username',
  message: '账号',
  default: '',
  validate: function (input)  {
    const done = this.async();
    setTimeout(function () {
      if (!input) {
        done(`请输入账号`);
      }
      done(null, true);
    }, 0);
  }
}

const passwordPrompt = {
  type: 'password',
  name: 'password',
  message: '密码',
  default: '',
  validate: function (input)  {
    const done = this.async();
    setTimeout(function () {
      if (!input) {
        done(`请输入密码`);
      }
      done(null, true);
    }, 0);
  }
}

exports.getBaseInfo = async function getBaseInfo () {
  const prompts = [
    usernamePrompt,
    passwordPrompt
  ]
  const { username, password } = await inquirer.prompt(prompts)
  return {
    account: username,
    password
  }
}