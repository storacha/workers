import { run, test } from './helpers/setup.js'

test.beforeEach(async (t) => {
  const mf = await run('worker.js')
  t.context = { mf }
})

test('should default not found ', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787/not/found')
  t.false(res.ok)
  t.is(res.status, 404)
})

test('should route to root /', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787/')
  t.is(res.status, 200)
  t.deepEqual(await res.text(), 'root')
})

test('should route to root without /', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787')
  t.is(res.status, 200)
  t.deepEqual(await res.text(), 'root')
})

test('should route to /:cid', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787/cid')
  t.is(res.status, 200)
  t.deepEqual(await res.text(), 'ssss')
})

test('should route to /error/route', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787/error/route')
  t.is(res.status, 500)
  t.deepEqual(await res.text(), 'oops')
})

test('should route to /cors/route', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787/cors/route')
  t.is(res.status, 200)
  t.deepEqual(await res.text(), 'cors')
  t.is(res.headers.get('Access-Control-Allow-Origin'), '*')
})

test('should route to /search/test?name=hugo', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/search/test?name=hugo'
  )
  t.is(res.status, 200)
  t.deepEqual(
    await res.text(),
    '{"input":"name=hugo","groups":{"name":"hugo"}}'
  )
})
