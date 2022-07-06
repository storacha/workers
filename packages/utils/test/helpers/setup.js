import { Miniflare } from 'miniflare'
import path from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * @param {string} filename
 * @param {boolean} [modules]
 */
export async function run(filename, modules = false) {
  const filePath = path.join(__dirname, filename)
  await build({
    entryPoints: [filePath],
    bundle: true,
    outfile: path.join(__dirname, 'dist', filename),
    sourcemap: true,
    format: modules ? 'esm' : 'iife',
  })

  return new Miniflare({
    scriptPath: path.join(__dirname, 'dist', filename),
    buildCommand: undefined,
    packagePath: false,
    wranglerConfigPath: false,
    sourceMap: true,
    compatibilityDate: '2022-06-01',
    compatibilityFlags: ['url_standard'],
    modules,
  })
}
