import { mf, test } from './helpers/setup.js'

test.before((t) => {
  t.context = { mf }
})

test('should fail', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch('http://localhost:8787/version')
  t.false(res.ok)
  t.is(res.status, 400)
  t.deepEqual(await res.json(), {
    ok: false,
    error: {
      code: 'HTTP_ERROR',
      message: 'Request URL is invalid.',
    },
  })
})

test('should fail without options', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/http://web3.storage/_next/static/media/squiggle.3c55b31d.png',
    {
      headers: { Accept: 'image/avif' },
    }
  )
  t.false(res.ok)
  t.is(res.status, 400)
  t.deepEqual(await res.json(), {
    ok: false,
    error: {
      code: 'HTTP_ERROR',
      message: 'Missing options for image.',
    },
  })
})

test('should fail without accept header', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/quality=75/http://web3.storage/_next/static/media/squiggle.3c55b31d.png'
  )
  t.false(res.ok)
  t.is(res.status, 400)
  t.deepEqual(await res.json(), {
    ok: false,
    error: {
      code: 'HTTP_ERROR',
      message: 'Missing "Accept" header',
    },
  })
})

test('should fail with relative source and no Referer', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/quality=75/_next/static/media/squiggle.3c55b31d.png',
    {
      headers: { Accept: 'image/avif' },
    }
  )
  t.false(res.ok)
  t.is(res.status, 400)
  t.deepEqual(await res.json(), {
    ok: false,
    error: {
      code: 'HTTP_ERROR',
      message:
        'Image URL is invalid: _next/static/media/squiggle.3c55b31d.png. Try either an absolute or a relative with a valid referer URL. Format: https://images.web3.storage/<OPTIONS>/<SOURCE-IMAGE>.',
    },
  })
})

test('should pass with relative source and Referer', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/quality=75/_next/static/media/squiggle.3c55b31d.png',
    {
      headers: { Accept: 'image/avif', referer: 'http://localhost/' },
    }
  )
  t.is(res.status, 307)
})

test('should fail with not supported hostname', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/quality=75/https://google.com/pic.png',
    {
      headers: { Accept: 'image/avif' },
    }
  )
  t.false(res.ok)
  t.is(res.status, 400)
  t.deepEqual(await res.json(), {
    ok: false,
    error: {
      code: 'HTTP_ERROR',
      message:
        'Image URL is invalid: https://google.com/pic.png. Try either an absolute or a relative with a valid referer URL. Format: https://images.web3.storage/<OPTIONS>/<SOURCE-IMAGE>.',
    },
  })
})

test('should fail with not supported image extension', async (t) => {
  const { mf } = t.context
  const res = await mf.dispatchFetch(
    'http://localhost:8787/quality=75/https://google.com/pic.svg',
    {
      headers: { Accept: 'image/avif' },
    }
  )
  t.false(res.ok)
  t.is(res.status, 400)
  t.deepEqual(await res.json(), {
    ok: false,
    error: {
      code: 'HTTP_ERROR',
      message:
        'Image URL is invalid: https://google.com/pic.svg. Try either an absolute or a relative with a valid referer URL. Format: https://images.web3.storage/<OPTIONS>/<SOURCE-IMAGE>.',
    },
  })
})
