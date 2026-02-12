/**
 * Build-time script: fetch SRD spells from Open5e API and write public/spells.json.
 * Run: npm run fetch-spells (or as part of npm run build)
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'public', 'spells.json')
const BASE = 'https://api.open5e.com/v2/spells'
const SRD_SLUG = 'wotc-srd'

async function fetchAllSpells() {
  const spells = []
  let url = `${BASE}/?document__slug=${SRD_SLUG}&limit=100&format=json`

  while (url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Open5e API error: ${res.status} ${res.statusText}`)
    const data = await res.json()
    spells.push(...(data.results || []))
    url = data.next || null
  }

  return spells
}

async function main() {
  console.log('Fetching SRD spells from Open5e...')
  const spells = await fetchAllSpells()
  console.log(`Fetched ${spells.length} spells.`)

  const dir = dirname(OUT_PATH)
  mkdirSync(dir, { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(spells), 'utf8')
  console.log(`Wrote ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
