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

function loggingWithFilteredFields() {
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
      logDataTransformer: (log) => {
        const { metadata } = log
        // Customize which fields to include
        const filteredMetadata = {
          request: {
            url: metadata.request.url,
            method: metadata.request.method,
          },
          response: metadata.response,
        }
        return { ...log, metadata: filteredMetadata }
      },
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
  await sleep(100) // Ensure start time differs from end time
  log.timeEnd('testing')

  t.is(log.logEventsBatch.length, 0)
  t.assert(log._times.get('testing').end > log._times.get('testing').start)
  t.is(
    log._times.get('testing').duration,
    log._times.get('testing').end - log._times.get('testing').start
  )
})

test('should log with filtered log fields', async (t) => {
  const log = loggingWithFilteredFields()

  /**
   * @type {import('../src/loki.js').Metadata}
   */
  const metadata = {
    request: {
      url: 'https://bafybeigbj3eeda2x7i5jdkvm5pljdxnwo5n3eripduhcsmwpm111111111.ipfs.nftstorage.link/mockFile.json',
      method: 'GET',
      headers: {
        accept: '*/*',
        accept_encoding: 'gzip',
        accept_language: '*',
        cache_control: 'only-if-cached',
        cf_connecting_ip: '1000:1000:1000::100',
      },
      cf: {
        longitude: '11.11111',
        httpProtocol: 'HTTP/1.1',
        continent: 'EU',
        clientAcceptEncoding: 'gzip, br',
        city: 'MockCity',
        timezone: 'Europe/Berlin',
        region: 'MockRegion',
        country: 'MO',
        onlyIfCachedGateways: '["https://w3s.link"]',
      },
    },
    cloudflare_worker: {
      version: '1.13.0',
      commit: 'da90000000000000403e6f9c2742aea033333333',
      branch: 'main',
      worker_id: 'XXXXXX1_-X',
      worker_started: 1_731_095_284_725,
    },
    response: {
      headers: {
        access_control_allow_origin: '*',
        access_control_expose_headers: 'Link',
        server_timing: 'request;dur=23',
      },
      status_code: 412,
      duration: 23,
    },
  }

  log.time('testing')
  log.log('testing message', 'info', '', metadata)
  log.timeEnd('testing')

  t.is(log.logEventsBatch.length, 1)
  t.deepEqual(Object.keys(log.logEventsBatch[0].metadata), [
    'request',
    'response',
  ])
  t.deepEqual(Object.keys(log.logEventsBatch[0].metadata.request), [
    'url',
    'method',
  ])
})

/**
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
