import { corsHeaders, preflight } from '../src/cors.js'
import { Response, Request } from '@web-std/fetch'
import test from 'ava'

test('should add cors headers ', async (t) => {
  // @ts-ignore
  const corsRsp = corsHeaders(new Request('https://localhost'), new Response())
  t.is(corsRsp.headers.get('Access-Control-Allow-Origin'), '*')
})

test('should add cors headers with origin', async (t) => {
  // @ts-ignore
  const corsRsp = corsHeaders(
    new Request('https://localhost', {
      headers: {
        Origin: 'yo',
      },
    }),
    // @ts-ignore
    new Response()
  )
  t.is(corsRsp.headers.get('Access-Control-Allow-Origin'), 'yo')
  t.is(corsRsp.headers.get('Vary'), 'Origin')
})

test('should fail preflight without proper headers', async (t) => {
  // @ts-ignore
  const corsRsp = preflight(new Request('https://localhost'))
  t.is(corsRsp.status, 405)
  t.is(corsRsp.statusText, 'Method Not Allowed')
  t.is(await corsRsp.text(), 'Non CORS options request not allowed')
})

test('should pass preflight with proper headers', async (t) => {
  // @ts-ignore
  const corsRsp = preflight(
    new Request('https://localhost', {
      headers: {
        Origin: 'yo',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'accept',
      },
    })
  )
  t.is(corsRsp.status, 204)
  t.is(corsRsp.headers.get('Content-Length'), '0')
  t.is(corsRsp.headers.get('Access-Control-Allow-Origin'), 'yo')
  t.is(
    corsRsp.headers.get('Access-Control-Allow-Methods'),
    'GET,POST,DELETE,PATCH,OPTIONS'
  )
  t.is(corsRsp.headers.get('Access-Control-Max-Age'), '86400')
  t.is(corsRsp.headers.get('Access-Control-Allow-Headers'), 'accept')
})
