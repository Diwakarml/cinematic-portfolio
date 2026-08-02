/**
 * push-to-github.mjs
 * Pushes all project files to GitHub using the REST API.
 * Usage: node push-to-github.mjs <YOUR_GITHUB_TOKEN>
 */

import fs from 'fs'
import path from 'path'

const TOKEN = process.argv[2]
const OWNER = 'Diwakarml'
const REPO  = 'cinematic-portfolio'
const BRANCH = 'main'

if (!TOKEN) {
  console.error('❌ Please provide your GitHub Personal Access Token as an argument.')
  console.error('   Usage: node push-to-github.mjs ghp_xxxxxxxxxxxxxxxxxxxx')
  process.exit(1)
}

const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}`
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'push-script',
  'Content-Type': 'application/json',
}

// Directories and files to skip
const SKIP = new Set(['.next', 'node_modules', '.git', 'push-to-github.mjs'])

function getAllFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const relPath = base ? `${base}/${entry.name}` : entry.name
    const absPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getAllFiles(absPath, relPath))
    } else {
      files.push({ relPath, absPath })
    }
  }
  return files
}

async function getFileSha(filePath) {
  const res = await fetch(`${BASE_URL}/contents/${filePath}?ref=${BRANCH}`, { headers: HEADERS })
  if (res.status === 200) {
    const data = await res.json()
    return data.sha
  }
  return null
}

async function pushFile(relPath, absPath) {
  const content = fs.readFileSync(absPath)
  const base64 = content.toString('base64')
  const sha = await getFileSha(relPath)

  const body = {
    message: `Deploy: update ${relPath}`,
    content: base64,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${BASE_URL}/contents/${relPath}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body),
  })

  const status = res.status
  if (status === 200 || status === 201) {
    console.log(`✅ ${relPath}`)
  } else {
    const err = await res.json()
    console.error(`❌ ${relPath} — ${err.message}`)
  }
}

const ROOT = path.dirname(new URL(import.meta.url).pathname).replace(/^\//, '')
const files = getAllFiles(ROOT)

console.log(`\n📦 Found ${files.length} files to push to ${OWNER}/${REPO}\n`)

for (const { relPath, absPath } of files) {
  await pushFile(relPath, absPath)
}

console.log('\n🚀 Done! Check your GitHub repository and Vercel will auto-deploy.')
