import test from 'ava'
import { Request } from '@web-std/fetch'
import { Logging } from '../src/loki.js'

function logging() {
  return new Logging(
    new Request('http://localhost'),
    { waitUntil: async () => {}, passThroughOnException: () => {} },
    {
      url: 'test',
      worker: 'test',
      branch: 'test',
      commit: 'test',
      version: 'test',
      env: 'test',
    }
  )
}

test('should add a log to the batch ', async (t) => {
  const log = logging()

  log.log('testing', 'info')

  t.is(log.logEventsBatch[0].level, 'info')
  t.is(log.logEventsBatch[0].message, 'testing')
})

test('should not log with time', async (t) => {
  const log = logging()

  log.time('testing', 'description')

  t.is(log.logEventsBatch.length, 0)
  t.is(log._times.get('testing').name, 'testing')
  t.is(log._times.get('testing').description, 'description')
  t.assert(Date.now() >= log._times.get('testing').start)
})

test('should not log with timeend', async (t) => {
  const log = logging()

  log.time('testing')
  await sleep(2000)
  log.timeEnd('testing')

  t.is(log.logEventsBatch.length, 0)
  t.assert(log._times.get('testing').end > log._times.get('testing').start)
  t.is(
    log._times.get('testing').duration,
    log._times.get('testing').end - log._times.get('testing').start
  )
})

/**
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
