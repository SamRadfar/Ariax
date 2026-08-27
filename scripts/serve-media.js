import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'media')
const port = Number(process.env.MEDIA_PORT || 8888)
const contentTypes = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname)
  const relative = pathname.replace(/^\/+/, '')
  const file = path.resolve(root, relative)

  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  fs.stat(file, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end('Not found')
      return
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600'
    })
    fs.createReadStream(file).pipe(response)
  })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`exercise media on http://127.0.0.1:${port}`)
})
