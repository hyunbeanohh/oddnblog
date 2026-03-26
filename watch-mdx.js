/**
 * 콘텐츠/프런트엔드 파일 변경 감지 시 gatsby develop 자동 실행
 * 사용법:
 *   npm run dev:watch        // 빠른 재시작 (기본)
 *   npm run dev:watch:clean  // 매 재시작 전에 clean 수행
 */

const chokidar = require("chokidar")
const { execSync, spawn } = require("child_process")
const path = require("path")

const ROOT = __dirname
const shouldClean = process.argv.includes("--clean")
let gatsbyProcess = null
let debounceTimer = null

function log(msg) {
  const time = new Date().toLocaleTimeString("ko-KR")
  console.log(`[${time}] ${msg}`)
}

function startGatsby() {
  if (gatsbyProcess) {
    log("기존 Gatsby 프로세스를 종료합니다...")
    gatsbyProcess.kill("SIGTERM")
    gatsbyProcess = null
  }

  log("개발 캐시 준비 중...")
  try {
    execSync("node scripts/prepare-gatsby-dev-cache.js", { stdio: "inherit", cwd: ROOT })
  } catch {
    // 캐시 준비 실패 시에도 develop 재시도
  }

  if (shouldClean) {
    log("gatsby clean 실행 중...")
    try {
      execSync("npx gatsby clean", { stdio: "inherit", cwd: ROOT })
    } catch {
      // clean 실패 시에도 develop 재시도
    }
  }

  log("gatsby develop 시작 중...")
  gatsbyProcess = spawn("npx", ["gatsby", "develop"], {
    stdio: "inherit",
    cwd: ROOT,
  })

  gatsbyProcess.on("exit", code => {
    if (code !== null && code !== 0) {
      log(`Gatsby가 코드 ${code}로 종료됐습니다.`)
    }
    gatsbyProcess = null
  })
}

function scheduleRestart(filePath) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const rel = path.relative(ROOT, filePath)
    log(`변경 감지: ${rel} → 재시작합니다.`)
    startGatsby()
  }, 500)
}

const watchTargets = [
  path.join(ROOT, "content/**/*.{md,mdx}"),
  path.join(ROOT, "src/**/*.{js,jsx,ts,tsx,css}"),
  path.join(ROOT, "global.css"),
  path.join(ROOT, "gatsby-*.{js,ts}"),
  path.join(ROOT, "tailwind.config.{js,ts}"),
  path.join(ROOT, "postcss.config.{js,cjs,mjs,ts}"),
]

// 콘텐츠/프런트엔드 파일 감시
const watcher = chokidar.watch(watchTargets, {
  ignoreInitial: true,
  persistent: true,
})

// rename is reported as unlink + add, so handle both consistently.
const restartEvents = new Set(["add", "change", "unlink", "addDir", "unlinkDir"])

watcher.on("all", (event, filePath) => {
  if (!restartEvents.has(event)) return
  scheduleRestart(filePath)
})

log("개발 파일 감시를 시작합니다. (content, src, global.css, Gatsby config)")

// 최초 gatsby develop 실행
startGatsby()

// 종료 시 정리
process.on("SIGINT", () => {
  log("종료 신호를 받았습니다. 정리 중...")
  watcher.close()
  if (gatsbyProcess) gatsbyProcess.kill("SIGTERM")
  process.exit(0)
})
