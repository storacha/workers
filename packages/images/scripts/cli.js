#!/usr/bin/env node
/* eslint-disable no-console */
import path from 'path'
import sade from 'sade'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prog = sade('api')

prog
  .command('build')
  .describe('Build the worker.')
  .option('--env', 'Environment', 'dev')
  .action(async (opts) => {
    try {
      await build({
        entryPoints: [path.join(__dirname, '../src/index.js')],
        bundle: true,
        outfile: 'dist/worker.js',
        legalComments: 'external',
        minify: opts.env !== 'dev',
        sourcemap: true,
      })
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })

prog.parse(process.argv)
