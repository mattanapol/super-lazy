import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkPlugin, parseFrontmatter } from '../tools/check-plugin.mjs'

function fixture () {
  const root = mkdtempSync(join(tmpdir(), 'ledger-test-'))
  mkdirSync(join(root, '.claude-plugin'), { recursive: true })
  writeFileSync(
    join(root, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'ledger', description: 'd', version: '0.1.0' })
  )
  addSkill(root, 'planning', 'plans work')
  return root
}

function addSkill (root, name, description, body = '') {
  mkdirSync(join(root, 'skills', name), { recursive: true })
  writeFileSync(
    join(root, 'skills', name, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n${body}`
  )
}

test('parseFrontmatter reads name and description', () => {
  const fm = parseFrontmatter('---\nname: a\ndescription: "b c"\n---\nbody')
  assert.equal(fm.name, 'a')
  assert.equal(fm.description, 'b c')
})

test('parseFrontmatter returns null without frontmatter', () => {
  assert.equal(parseFrontmatter('# no frontmatter'), null)
})

test('a well-formed plugin has no errors', () => {
  const root = fixture()
  assert.deepEqual(checkPlugin(root), [])
  rmSync(root, { recursive: true, force: true })
})

test('missing plugin.json is an error', () => {
  const root = fixture()
  rmSync(join(root, '.claude-plugin', 'plugin.json'))
  assert.match(checkPlugin(root).join('\n'), /missing \.claude-plugin\/plugin\.json/)
  rmSync(root, { recursive: true, force: true })
})

test('plugin.json missing a required key is an error', () => {
  const root = fixture()
  writeFileSync(
    join(root, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'ledger' })
  )
  const out = checkPlugin(root).join('\n')
  assert.match(out, /missing "description"/)
  assert.match(out, /missing "version"/)
  rmSync(root, { recursive: true, force: true })
})

test('frontmatter name must match the directory name', () => {
  const root = fixture()
  writeFileSync(
    join(root, 'skills', 'planning', 'SKILL.md'),
    '---\nname: plannning\ndescription: d\n---\n'
  )
  assert.match(checkPlugin(root).join('\n'), /frontmatter name "plannning" does not match/)
  rmSync(root, { recursive: true, force: true })
})

test('a banned superpowers: reference is an error', () => {
  const root = fixture()
  addSkill(root, 'verifying', 'verifies', '\nUse superpowers:verification-before-completion.\n')
  assert.match(checkPlugin(root).join('\n'), /banned string "superpowers:"/)
  rmSync(root, { recursive: true, force: true })
})

test('a banned docs/superpowers/ path is an error', () => {
  const root = fixture()
  addSkill(root, 'verifying', 'verifies', '\nSave to docs/superpowers/specs/x.md\n')
  assert.match(checkPlugin(root).join('\n'), /banned string "docs\/superpowers\/"/)
  rmSync(root, { recursive: true, force: true })
})

test('a ledger: reference to a missing skill is an error', () => {
  const root = fixture()
  addSkill(root, 'verifying', 'verifies', '\nNext use ledger:nonexistent.\n')
  assert.match(checkPlugin(root).join('\n'), /unknown skill "ledger:nonexistent"/)
  rmSync(root, { recursive: true, force: true })
})

test('a ledger: reference to an existing skill passes', () => {
  const root = fixture()
  addSkill(root, 'verifying', 'verifies', '\nNext use ledger:planning.\n')
  assert.deepEqual(checkPlugin(root), [])
  rmSync(root, { recursive: true, force: true })
})

test('a broken relative markdown link is an error', () => {
  const root = fixture()
  addSkill(root, 'verifying', 'verifies', '\nSee [gone](../using-superpowers/references/x.md).\n')
  assert.match(checkPlugin(root).join('\n'), /broken relative link/)
  rmSync(root, { recursive: true, force: true })
})

test('a working relative markdown link passes', () => {
  const root = fixture()
  writeFileSync(join(root, 'skills', 'planning', 'notes.md'), 'hi')
  addSkill(root, 'verifying', 'verifies', '\nSee [notes](../planning/notes.md).\n')
  assert.deepEqual(checkPlugin(root), [])
  rmSync(root, { recursive: true, force: true })
})
