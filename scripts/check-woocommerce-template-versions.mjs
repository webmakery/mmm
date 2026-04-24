#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

function usage() {
  console.error(
    "Usage: node scripts/check-woocommerce-template-versions.mjs --theme <path/to/theme/woocommerce> --plugin <path/to/plugins/woocommerce/templates>"
  )
}

function parseArgs(argv) {
  const args = { theme: "", plugin: "" }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]

    if (token === "--theme") {
      args.theme = argv[i + 1] || ""
      i += 1
      continue
    }

    if (token === "--plugin") {
      args.plugin = argv[i + 1] || ""
      i += 1
      continue
    }

    if (token === "--help" || token === "-h") {
      usage()
      process.exit(0)
    }
  }

  return args
}

function walkPhpFiles(rootDir, currentDir = rootDir, acc = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      walkPhpFiles(rootDir, fullPath, acc)
      continue
    }

    if (entry.isFile() && entry.name.endsWith(".php")) {
      acc.push(path.relative(rootDir, fullPath))
    }
  }

  return acc
}

function parseVersionFromTemplate(filePath) {
  const contents = fs.readFileSync(filePath, "utf8")
  const match = contents.match(/@version\s+([0-9]+(?:\.[0-9]+){0,3})/i)
  return match ? match[1] : null
}

function compareVersions(a, b) {
  const aParts = a.split(".").map((x) => Number.parseInt(x, 10))
  const bParts = b.split(".").map((x) => Number.parseInt(x, 10))
  const maxLength = Math.max(aParts.length, bParts.length)

  for (let i = 0; i < maxLength; i += 1) {
    const left = aParts[i] ?? 0
    const right = bParts[i] ?? 0

    if (left < right) return -1
    if (left > right) return 1
  }

  return 0
}

function pad(value, width) {
  if (value.length >= width) return value
  return `${value}${" ".repeat(width - value.length)}`
}

function main() {
  const { theme, plugin } = parseArgs(process.argv)

  if (!theme || !plugin) {
    usage()
    process.exit(2)
  }

  const themePath = path.resolve(theme)
  const pluginPath = path.resolve(plugin)

  if (!fs.existsSync(themePath) || !fs.statSync(themePath).isDirectory()) {
    console.error(`Theme templates directory not found: ${themePath}`)
    process.exit(2)
  }

  if (!fs.existsSync(pluginPath) || !fs.statSync(pluginPath).isDirectory()) {
    console.error(`WooCommerce plugin templates directory not found: ${pluginPath}`)
    process.exit(2)
  }

  const themeFiles = walkPhpFiles(themePath).sort((a, b) => a.localeCompare(b))

  const rows = []
  let hasIssues = false

  for (const relativeFile of themeFiles) {
    const themeFilePath = path.join(themePath, relativeFile)
    const pluginFilePath = path.join(pluginPath, relativeFile)

    if (!fs.existsSync(pluginFilePath)) {
      hasIssues = true
      rows.push({
        file: relativeFile,
        themeVersion: parseVersionFromTemplate(themeFilePath) ?? "missing",
        pluginVersion: "missing",
        status: "NO CORE MATCH",
      })
      continue
    }

    const themeVersion = parseVersionFromTemplate(themeFilePath)
    const pluginVersion = parseVersionFromTemplate(pluginFilePath)

    if (!themeVersion || !pluginVersion) {
      hasIssues = true
      rows.push({
        file: relativeFile,
        themeVersion: themeVersion ?? "missing",
        pluginVersion: pluginVersion ?? "missing",
        status: "MISSING @version",
      })
      continue
    }

    const cmp = compareVersions(themeVersion, pluginVersion)

    if (cmp < 0) {
      hasIssues = true
      rows.push({ file: relativeFile, themeVersion, pluginVersion, status: "OUTDATED" })
      continue
    }

    if (cmp > 0) {
      rows.push({ file: relativeFile, themeVersion, pluginVersion, status: "AHEAD/CUSTOM" })
      continue
    }

    rows.push({ file: relativeFile, themeVersion, pluginVersion, status: "OK" })
  }

  const fileWidth = Math.max("File".length, ...rows.map((r) => r.file.length))
  const themeWidth = Math.max("Theme".length, ...rows.map((r) => r.themeVersion.length))
  const pluginWidth = Math.max("Plugin".length, ...rows.map((r) => r.pluginVersion.length))

  console.log(`${pad("File", fileWidth)}  ${pad("Theme", themeWidth)}  ${pad("Plugin", pluginWidth)}  Status`)
  console.log(`${"-".repeat(fileWidth)}  ${"-".repeat(themeWidth)}  ${"-".repeat(pluginWidth)}  ------`)

  for (const row of rows) {
    console.log(
      `${pad(row.file, fileWidth)}  ${pad(row.themeVersion, themeWidth)}  ${pad(row.pluginVersion, pluginWidth)}  ${row.status}`
    )
  }

  if (hasIssues) {
    console.error("\nCompatibility check failed: one or more overrides need an update.")
    process.exit(1)
  }

  console.log("\nCompatibility check passed: all overridden templates match or exceed plugin versions.")
}

main()
