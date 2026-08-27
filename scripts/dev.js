import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const children = []
let stopping = false

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    ...options
  })

  child.on('error', error => {
    console.error(`Could not start ${command}: ${error.message}`)
    stop(1)
  })
  child.on('exit', code => {
    if (!stopping) stop(code ?? 1)
  })
  children.push(child)
}

function stop(code) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 250)
}

function portIsFree(port) {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.listen(port, () => server.close(() => resolve(true)))
  })
}

async function findPort(preferred) {
  for (let port = preferred; port < preferred + 100; port += 1) {
    if (await portIsFree(port)) return port
  }
  throw new Error(`No free port found between ${preferred} and ${preferred + 99}`)
}

const apiPort = process.env.PORT ? Number(process.env.PORT) : await findPort(3000)
const mediaPort = process.env.MEDIA_PORT ? Number(process.env.MEDIA_PORT) : await findPort(8888)
const frontendPort = process.env.FRONTEND_PORT ? Number(process.env.FRONTEND_PORT) : await findPort(5173)
const childEnv = {
  ...process.env,
  PORT: String(apiPort),
  MEDIA_PORT: String(mediaPort),
  FRONTEND_PORT: String(frontendPort),
  API_TARGET: process.env.API_TARGET || `http://127.0.0.1:${apiPort}`,
  MEDIA_TARGET: process.env.MEDIA_TARGET || `http://127.0.0.1:${mediaPort}`,
  ORIGIN: process.env.ORIGIN || `http://localhost:${frontendPort}`
}

run(process.execPath, ['scripts/start-api.js'], { env: childEnv })
run(process.execPath, ['scripts/serve-media.js'], { env: childEnv })
if (process.env.npm_execpath) {
  run(process.execPath, [process.env.npm_execpath, 'run', 'dev:frontend'], { env: childEnv })
} else {
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:frontend'], {
    shell: process.platform === 'win32',
    env: childEnv
  })
}

process.once('SIGINT', () => stop(0))
process.once('SIGTERM', () => stop(0))
