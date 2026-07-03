import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'fs'
import path from 'path'

// Obsidian only ever reads three files from an installed plugin's folder:
// manifest.json, main.js, and (if present) styles.css. Everything else in
// this repo (src/, package.json, configs, docs, tests, node_modules...) is
// build/dev tooling Obsidian never touches. This script assembles exactly
// that minimal set into dist/<plugin-id>/, ready to be copied or symlinked
// into a vault's `.obsidian/plugins/` folder.

const REQUIRED_FILES = ['main.js', 'manifest.json']
const OPTIONAL_FILES = ['styles.css']

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const outDir = path.join('dist', manifest.id)

for (const file of REQUIRED_FILES) {
  if (!existsSync(file)) {
    console.error(
      `Missing "${file}". Run "npm run build" first (this script does not build for you).`,
    )
    process.exit(1)
  }
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const file of [...REQUIRED_FILES, ...OPTIONAL_FILES]) {
  if (existsSync(file)) copyFileSync(file, path.join(outDir, file))
}

console.log(`Packaged Obsidian plugin -> ${outDir}`)
console.log(
  `Copy or symlink that folder into <vault>/.obsidian/plugins/${manifest.id}`,
)
