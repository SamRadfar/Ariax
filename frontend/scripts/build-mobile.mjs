// Mobile build: `vite build` with the CDN media bases baked in, then `cap sync`.
// The inline `VAR=value vite build` form is POSIX shell syntax; on Windows npm runs
// scripts through cmd.exe, which reads VITE_MOBILE=1 as a program name and fails
// before Vite starts. Setting the variables here keeps one command working everywhere.
import { spawnSync } from 'node:child_process'

const DATASET = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd'

const env = {
  ...process.env,
  VITE_MOBILE: '1',
  VITE_IMG_BASE: `${DATASET}/images/`,
  VITE_GIF_BASE: `${DATASET}/videos/`
}

for (const [cmd, args] of [['vite', ['build']], ['cap', ['sync']]]) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
