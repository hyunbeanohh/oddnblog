"use strict"

const { spawn } = require("child_process")
const fs = require("fs")
const net = require("net")
const os = require("os")
const path = require("path")

const MIN_NODE_MAJOR = 18
const MAX_NODE_MAJOR = 22
const REEXEC_ENV_KEY = "ODDN_GATSBY_DEV_NODE"
const LOCAL_XDG_CONFIG_HOME = path.join(os.tmpdir(), "oddn-gatsby-xdg-config")

function getNodeMajorVersion() {
  const [major] = process.versions.node.split(".")
  return Number(major)
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number)
  const rightParts = right.split(".").map(Number)

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftValue = leftParts[index] ?? 0
    const rightValue = rightParts[index] ?? 0
    if (leftValue !== rightValue) return leftValue - rightValue
  }

  return 0
}

function findCompatibleNodeBinary() {
  const versionsRoot = path.join(os.homedir(), ".nvm", "versions", "node")
  if (!fs.existsSync(versionsRoot)) return null

  const versions = fs
    .readdirSync(versionsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^v\d+\.\d+\.\d+$/.test(entry.name))
    .map(entry => entry.name.slice(1))
    .filter(version => {
      const major = Number(version.split(".")[0])
      return major >= MIN_NODE_MAJOR && major <= MAX_NODE_MAJOR
    })
    .sort((left, right) => compareVersions(right, left))

  const selected = versions[0]
  if (!selected) return null

  const binary = path.join(versionsRoot, `v${selected}`, "bin", process.platform === "win32" ? "node.exe" : "node")
  return fs.existsSync(binary) ? binary : null
}

function reexecWithCompatibleNode(nodeBinary) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBinary, [__filename], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: createRuntimeEnv({
        [REEXEC_ENV_KEY]: nodeBinary,
      }),
    })

    child.on("exit", code => resolve(code ?? 0))
    child.on("error", reject)
  })
}

async function ensureSupportedNodeVersion() {
  const major = getNodeMajorVersion()

  if (major >= MIN_NODE_MAJOR && major <= MAX_NODE_MAJOR) {
    return true
  }

  if (!process.env[REEXEC_ENV_KEY]) {
    const compatibleNodeBinary = findCompatibleNodeBinary()
    if (compatibleNodeBinary) {
      console.log("")
      console.log(`[dev] 현재 Node v${process.versions.node} 대신 ${compatibleNodeBinary} 로 다시 실행합니다.`)
      console.log("")
      const exitCode = await reexecWithCompatibleNode(compatibleNodeBinary)
      process.exit(exitCode)
    }
  }

  console.error("")
  console.error("[dev] 지원되지 않는 Node.js 버전입니다.")
  console.error(`[dev] 현재 버전: v${process.versions.node}`)
  console.error(`[dev] 지원 범위: v${MIN_NODE_MAJOR} ~ v${MAX_NODE_MAJOR}`)
  console.error("[dev] 해결 방법:")
  console.error("[dev]   1. Node 18~22 설치")
  console.error("[dev]   2. `nvm use` 실행")
  console.error("[dev]   3. 다시 `npm run dev` 실행")
  console.error("")
  process.exit(1)
}

function createRuntimeEnv(overrides = {}) {
  fs.mkdirSync(LOCAL_XDG_CONFIG_HOME, { recursive: true })

  return {
    ...process.env,
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME || LOCAL_XDG_CONFIG_HOME,
    GATSBY_FEEDBACK_DISABLED: process.env.GATSBY_FEEDBACK_DISABLED || "1",
    ...overrides,
  }
}

function runPrepareScript() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join("scripts", "prepare-gatsby-dev-cache.js")], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: createRuntimeEnv(),
    })

    child.on("exit", code => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`prepare-gatsby-dev-cache.js exited with code ${code}`))
    })
  })
}

function runGatsbyDevelop() {
  const cliArgs = buildGatsbyCliArgs()
  const child = spawn(
    process.execPath,
    [
      "-r",
      path.join(process.cwd(), "scripts", "gatsby-dev-preload.js"),
      path.join(process.cwd(), "node_modules", "gatsby", "cli.js"),
      "develop",
      ...cliArgs,
    ],
    {
      stdio: ["inherit", "pipe", "pipe"],
      cwd: process.cwd(),
      env: createRuntimeEnv(),
    }
  )

  let stderrBuffer = ""

  child.stdout.on("data", chunk => {
    process.stdout.write(chunk)
  })

  child.stderr.on("data", chunk => {
    const text = chunk.toString()
    stderrBuffer += text
    if (stderrBuffer.length > 8000) {
      stderrBuffer = stderrBuffer.slice(-8000)
    }
    process.stderr.write(chunk)
  })

  child.on("exit", code => {
    if (code && stderrBuffer.includes("listen EPERM: operation not permitted")) {
      console.error("")
      console.error("[dev] Gatsby 개발 서버 초기화는 끝났지만 현재 터미널 환경에서 로컬 포트를 열 수 없습니다.")
      console.error("[dev] Codex 샌드박스가 원인일 수 있으니, 일반 로컬 터미널에서 `nvm use && npm run dev`로 실행해 보세요.")
      console.error("")
    }

    process.exit(code ?? 0)
  })
}

function readArgValue(flagNames) {
  for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index]
    const matchedFlag = flagNames.find(flag => value === flag || value.startsWith(`${flag}=`))

    if (!matchedFlag) continue
    if (value.includes("=")) return value.split("=").slice(1).join("=")
    return process.argv[index + 1]
  }

  return null
}

function hasArg(flagNames) {
  return flagNames.some(flag =>
    process.argv.slice(2).some(value => value === flag || value.startsWith(`${flag}=`))
  )
}

function buildGatsbyCliArgs() {
  const cliArgs = [...process.argv.slice(2)]

  if (!hasArg(["--host", "-H"]) && !process.env.HOST) {
    cliArgs.push("--host", "127.0.0.1")
  }

  return cliArgs
}

function ensurePortAvailable() {
  return new Promise((resolve, reject) => {
    const portValue = readArgValue(["--port", "-p"]) || process.env.PORT || "8000"
    const hostValue = readArgValue(["--host", "-H"]) || process.env.HOST || "127.0.0.1"
    const port = Number(portValue)

    if (!Number.isFinite(port)) {
      reject(new Error(`잘못된 포트 값입니다: ${portValue}`))
      return
    }

    const server = net.createServer()

    server.once("error", error => {
      server.close()
      if (error.code === "EADDRINUSE") {
        reject(new Error(`포트 ${port}가 이미 사용 중입니다. 다른 포트로 실행해 주세요.`))
        return
      }

      if (error.code === "EPERM") {
        console.warn("")
        console.warn(`[dev] 포트 ${port} 사전 점검을 건너뜁니다: ${error.message}`)
        console.warn("")
        resolve()
        return
      }

      reject(error)
    })

    server.once("listening", () => {
      server.close(closeError => {
        if (closeError) {
          reject(closeError)
          return
        }

        resolve()
      })
    })

    server.listen(port, hostValue)
  })
}

async function main() {
  await ensureSupportedNodeVersion()
  await ensurePortAvailable()
  await runPrepareScript()
  runGatsbyDevelop()
}

main().catch(error => {
  console.error("")
  console.error(`[dev] 개발 서버 시작 중 오류가 발생했습니다: ${error.message}`)
  console.error("")
  process.exit(1)
})
