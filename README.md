[TOC]

# dai-cli命令行工具使用手册

## 安装与配置

- 先安装 nodejs

   下载地址：https://nodejs.org/zh-cn/

   安装长期维护版本

   安装成功可以输入以下指令看看是否能够输出版本号即表示安装成功

   ```sh
   node -v
   ```

   ```sh
   npm -v
   ```

- 安装 dai-cli
   ```sh
   npm install -g @fftai/dai-cli
   ```

   安装成功后输入以下指令，输出版本号则表示安装成功

   ```sh
   dai -V
   ```
   
- 基本配置，复制下面的代码，这步很重要

   - 配置禅道地址
      ```sh
      dai config set ZENTAO_REQUEST_URL 禅道地址
      ```

   - 配置gitea地址
      ```sh
      dai config set GITEA_REQUEST_URL gitea地址
      ```

   - 配置 gitea token 免密登录

      1. 登录 gitea 按照拿到 `token` 步骤：个人设置 -> 应用 -> 生成一个token

      2. 配置 gitea token
         ```sh
         dai config set GITEA_USER_TOKEN 你的token
         ```


## 命令使用说明

- 请在你的项目根目录下运行`dai`，因为他需要操作`git` ！！！！！！

- 使用命令中有任何疑问 你都可以 通过 `-h` 获得帮助

- 通用命令 -h, --help 可以查看帮助命令帮助, 具体如下
  查看所有命令的使用帮助

  ```sh
  dai -h
  ```

  查看开始命令的使用帮助

  ```sh
  dai start -h
  ```

  

- 几个基本知识

  方括号代表可选值：[] 
  尖括号代表必传值：<>

  -y, --yes 逗号前面的为选项简写，逗号后为完整写法

## 命令介绍

### start命令

开始一个任务 / BUG

在输入 `dai start` 的情况下 如果有 Bug 会优先显示 Bug

> 如果你开始了一个 bug 将会询问你是否打开详情查看，而任务则不会，如果你只是想看的详情，用 dai list

开始后可以帮助你切换到对应的开发分支，并且在禅道上也维护相应的状态。

具体流程如下：

1. 检测当前分支是否有未提交代码，有未提交则 `git commit`
2. 更新`基础分支`
3. 从`基础分支`切出来到`开发分支`
4. 在禅道上开始任务

```sh
dai start [name]
```

#### 例子

开始任务号为 1234 的任务

```sh
dai start T#1234
```

#### start命令选项

```sh
-y, --yes                同意所有自动操作。[1. 自动把 stash 区的文件 pop 出来, 2. commit 所有文件]
-b, --base <branchName>  设置基础分支名称
-t, --time <hour>        预估时间
-m, --comment <comment>  任务备注
-sg, --skip-git-control  只在禅道开始任务，跳过分支管理
-h, --help               display help for command
```

#### 例子

开始一个任务，并且制定基础分支为master

```sh
dai start -b master
```

### pause命令

在`禅道`暂停一个任务, 可直接传入name来指令暂停的任务

```sh
dai pause [name]
```

#### 例子

暂停一个任务号为 1234 的任务

```sh
dai pause T#1234
```

### done命令

完成一个任务，这个任务就是当前分支的名称！

完成任务命令可以帮助你把基础分支的代码合并以后，push 到 gitea 上，同时进行 pull request

具体流程如下：

1. 检测当前分支是否有位提交代码，有未提交则提交
2. 下载最新的基础分支(fetch)
3. 合并刚刚下载的基础分支代码到当前分支
4. push代码（耗时操作）
5. 创建合并请求（耗时操作，而且比较长）

```sh
-y, --yes                同意所有自动操作。[1. 自动把 stash 区的文件 pop 出来, 2. commit 所有文件]
-b, --base <branchName>  设置基础分支名称
-h, --help               display help for command
```

### login命令

登录一个系统，不过一般不用，除非你想登录另一个账号

```sh
dai login [system]
```

system 可以是 `zentao`，`gitea`

### config命令	

设置管理

```sh
dai config [name]              列出配置，不传 [name] 则列出所有配置
dai config list [name]         列出配置，不传 [name] 则列出所有配置
dai config set <name> <value>  写入配置
dai config clean               清空配置
dai config help [command]      display help for command
```

### list命令

查看 任务 / bug 列表，对选中的 任务 / bug 回车可以查看详情

```sh
dai list [options] [type]
查看我的 任务/BUG, [type] 取值为 task, bug
不传的话有bug会显示bug列表，没有bug会显示任务列表
```

