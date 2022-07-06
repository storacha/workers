import { Router } from '../../src/router.js'

/**
 * @typedef {{name: string}} ENV
 */

/** @type {Router<ENV>} */
const r = new Router()

r.add('get', '/', () => {
  return new Response('root')
})

r.add('get', '/version', (request, env, ctx) => {
  return new Response('222')
})

r.add('get', '/:cid', [test, cid])

/**
 * @param {import('../../src/router.js').ParsedRequest} request
 * @param {ENV} env
 */
function cid(request, env) {
  return new Response(env.name)
}

/**
 * @param {import('../../src/router.js').ParsedRequest} request
 * @param {ENV} env
 */
function test(request, env) {
  env.name = 'ssss'
}

r.add('get', '/error/route', (request, env, ctx) => {
  throw new Error('oops')
})

r.add(
  'get',
  // eslint-disable-next-line no-undef
  new URLPattern({ pathname: '/search/test', search: 'name=:name' }),
  (request, env, ctx) => {
    return new Response(JSON.stringify(request.pattern.search))
  }
)

r.add(
  'get',
  '/cors/route',
  (request, env, ctx) => {
    return new Response('cors')
  },
  postCors
)

addEventListener('fetch', (event) => {
  event.respondWith(
    r
      .handle(event, { name: 'hugo' })
      .then((rsp) => {
        // return postCors(event.request, rsp)
        return rsp
      })
      .catch(errorHandler)
  )
})

const errorHandler = (/** @type {{ message: any; status: any; }} */ error) =>
  new Response(error.message || 'Server Error', { status: error.status || 500 })

/**
 * @param {Request} req
 * @param {Response} rsp
 */
export function postCors(req, rsp) {
  const origin = req.headers.get('origin')
  if (origin) {
    rsp.headers.set('Access-Control-Allow-Origin', origin)
    rsp.headers.set(
      'Access-Control-Allow-Methods',
      'GET,POST,DELETE,PATCH,OPTIONS'
    )
    rsp.headers.set('Vary', 'Origin')
  } else {
    rsp.headers.set('Access-Control-Allow-Origin', '*')
  }
  return rsp
}
