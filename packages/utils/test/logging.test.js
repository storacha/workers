import test from 'ava'
import { Request } from '@web-std/fetch'
import { Logging } from '../src/logging.js'

function logging() {
  return new Logging(
    new Request('http://localhost'),
    { waitUntil: async () => {}, passThroughOnException: () => {} },
    { branch: 'test', commit: 'test', version: 'test', env: 'test' }
  )
}

test('should add a log to the batch ', async (t) => {
  const log = logging()

  log.log('testing')

  t.is(log.logEventsBatch[0].level, 'log')
  t.is(log.logEventsBatch[0].message, 'testing')
})

test('should not log with time', async (t) => {
  const log = logging()

  log.time('testing')

  t.is(log.logEventsBatch.length, 0)
})

test('should not log with timeend', async (t) => {
  const log = logging()

  log.time('testing')
  log.timeEnd('testing')

  t.is(log.logEventsBatch.length, 0)
})

test('should log with timeend + shouldLog flag', async (t) => {
  const log = logging()

  log.time('testing')
  log.timeEnd('testing', true)

  t.is(log.logEventsBatch[0].level, 'time')
  t.is(log.logEventsBatch[0].message, 'testing')
  // @ts-ignore
  t.assert(log.logEventsBatch[0].duration >= 0)
  t.deepEqual(log.logEventsBatch[0].context, {})
})

test('should log with timeend + shouldLog flag with context', async (t) => {
  const log = logging()

  log.time('testing', undefined, { test: 1, key: 1 })
  log.timeEnd('testing', true, { test: 2 })

  t.is(log.logEventsBatch[0].level, 'time')
  t.is(log.logEventsBatch[0].message, 'testing')
  t.is(log.logEventsBatch[0].duration, 0)
  t.deepEqual(log.logEventsBatch[0].context, { test: 2, key: 1 })
})
