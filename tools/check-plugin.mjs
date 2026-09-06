#!/usr/bin/env node
// Structural validator for the ledger plugin.
// Prints "plugin check passed" and exits 0 only when every check passes.
// The success token is deliberately unique so a gate can assert on it.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const BANNED = ['superpowers:', 'docs/superpowers/']
const TEXT_EXT = /\.(md|mjs|js|json|txt|sh)$/

export function walk (dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

export function parseFrontmatter (text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!m) return null
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(line)
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return fm
}

function checkManifest (root, errors) {
  const path = join(root, '.claude-plugin', 'plugin.json')
  if (!existsSync(path)) {
    errors.push('missing .claude-plugin/plugin.json')
    return
  }
  let manifest
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    errors.push(`.claude-plugin/plugin.json is not valid JSON: ${err.message}`)
    return
  }
  for (const key of ['name', 'description', 'version']) {
    if (!manifest[key]) errors.push(`.claude-plugin/plugin.json missing "${key}"`)
  }
}

function checkSkillFrontmatter (skillsDir, names, errors) {
  for (const name of names) {
    const path = join(skillsDir, name, 'SKILL.md')
    if (!existsSync(path)) {
      errors.push(`skills/${name}: missing SKILL.md`)
      continue
    }
    const fm = parseFrontmatter(readFileSync(path, 'utf8'))
    if (!fm) {
      errors.push(`skills/${name}/SKILL.md: no YAML frontmatter`)
      continue
    }
    if (!fm.name) errors.push(`skills/${name}/SKILL.md: frontmatter missing name`)
    else if (fm.name !== name) {
      errors.push(`skills/${name}/SKILL.md: frontmatter name "${fm.name}" does not match directory`)
    }
    if (!fm.description) errors.push(`skills/${name}/SKILL.md: frontmatter missing description`)
  }
}

function checkFileContents (root, skillsDir, names, errors) {
  for (const file of walk(skillsDir)) {
    if (!TEXT_EXT.test(file)) continue
    const rel = relative(root, file)
    const text = readFileSync(file, 'utf8')

    for (const banned of BANNED) {
      if (text.includes(banned)) errors.push(`${rel}: contains banned string "${banned}"`)
    }

    for (const match of text.matchAll(/\bledger:([a-z][a-z0-9-]*)/g)) {
      if (!names.includes(match[1])) {
        errors.push(`${rel}: references unknown skill "ledger:${match[1]}"`)
      }
    }

    for (const match of text.matchAll(/\[[^\]]*\]\((\.[^)#\s]+)/g)) {
      const target = resolve(dirname(file), match[1])
      if (!existsSync(target)) {
        errors.push(`${rel}: broken relative link "${match[1]}"`)
      }
    }
  }
}

export function checkPlugin (root) {
  const errors = []
  checkManifest(root, errors)

  const skillsDir = join(root, 'skills')
  if (!existsSync(skillsDir)) {
    errors.push('missing skills/ directory')
    return errors
  }
  const names = readdirSync(skillsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)

  checkSkillFrontmatter(skillsDir, names, errors)
  checkFileContents(root, skillsDir, names, errors)
  return errors
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const errors = checkPlugin(process.argv[2] ?? process.cwd())
  if (errors.length > 0) {
    for (const err of errors) console.error(`ERROR ${err}`)
    console.error(`${errors.length} problem(s) found`)
    process.exit(1)
  }
  console.log('plugin check passed')
}
