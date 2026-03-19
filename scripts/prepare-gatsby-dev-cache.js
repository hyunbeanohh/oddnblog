const fs = require("fs")
const path = require("path")

const cacheRoot = path.join(process.cwd(), ".cache")
const virtualRoot = path.join(process.cwd(), ".cache", "_this_is_virtual_fs_path_")
const dev404File = path.join(cacheRoot, "dev-404-page.js")
const proxyFile = path.join(virtualRoot, "dev-404-page.js")

const dev404StubSource = `'use strict'
const React = require('react')

function Dev404Fallback() {
  return React.createElement('div', null, 'Preparing Gatsby dev 404 page...')
}

module.exports = Dev404Fallback
module.exports.default = Dev404Fallback
`

const proxySource = `'use strict'
module.exports = require('../dev-404-page.js')
`

fs.mkdirSync(cacheRoot, { recursive: true })
fs.mkdirSync(virtualRoot, { recursive: true })

if (!fs.existsSync(dev404File)) {
  fs.writeFileSync(dev404File, dev404StubSource, "utf8")
}

if (!fs.existsSync(proxyFile)) {
  fs.writeFileSync(proxyFile, proxySource, "utf8")
}
