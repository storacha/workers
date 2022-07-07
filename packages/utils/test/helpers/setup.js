import anyTest from 'ava'
import { build } from 'esbuild'
import { Miniflare } from 'miniflare'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * @typedef {import("ava").TestFn<{mf: Miniflare}>} TestFn
 */

// eslint-disable-next-line unicorn/prefer-export-from
export const test = /** @type {TestFn} */ (anyTest)

/**
 * @param {string} filename
 * @param {boolean} [modules]
 */
export async function run(filename, modules = false) {
  const filePath = path.join(__dirname, filename)
  const outPath = path.join(__dirname, 'dist', filename)

  await build({
    entryPoints: [filePath],
    bundle: true,
    outfile: outPath,
    sourcemap: true,
    format: modules ? 'esm' : 'iife',
  })

  return new Miniflare({
    scriptPath: outPath,
    buildCommand: undefined,
    packagePath: false,
    wranglerConfigPath: false,
    sourceMap: true,
    compatibilityDate: '2022-06-01',
    compatibilityFlags: ['url_standard'],
    modules,
  })
}
