'use strict';

const axios = require('axios')
const semver = require('semver')
const urlJoin = require('url-join')

function getNpmInfo(npmName, registry) {
  if (!npmName) return null;
  const registryUrl = registry || getDefaultRegisty()
  const npmInfoUrl = urlJoin(registryUrl, npmName)
  return axios.get(npmInfoUrl).then(res => {
    if (res.status === 200) {
      return res.data
    }
    return null
  }).catch(err => {
    return Promise.reject(err)
  })
}

function getDefaultRegisty(isOrigin = true) {
  return isOrigin ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  if (data) {
    return Object.keys(data.versions)
  } else {
    return []
  }
}

function getNpmSemverVersions(baseVersion, versions) {
  return versions
    .filter(version => semver.satisfies(version, `>${baseVersion}`))
    .sort((a, b) => semver.gt(b, a) ? 1 : -1)
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersion = getNpmSemverVersions(baseVersion, versions)
  if (newVersion && newVersion.length) {
    return newVersion[0]
  }
}

async function getNpmLatestVersion(npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0]
  }
  return null
}

module.exports = {
  getNpmInfo,
  getNpmSemverVersion,
  getDefaultRegisty,
  getNpmLatestVersion
};