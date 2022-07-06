# Cloudflare Workers Utils

## Router

Tiny, zero-dependency router with route param and query parsing based on [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) - built for Cloudflare Workers

### Features

- Small, fast with zero dependencies
- Typescript support
- Supports sync/async handlers, middleware and response handlers
- Parses route params, query string and URLPatterns, exposed in the Request object.
- Supports Cloudflare ESM Modules and Service Worker syntax
- Supports route matching with URLPattern or string

### Install

```bash
npm install @web3-storage/worker-utils
```

### Usage

```js
import { Router } from '@web3-storage/worker-utils/router'

/**
 * @typedef {{name: string}} ENV
 */

/** @type {Router<ENV>} */
const r = new Router()

r.add('get', '/', () => {
  return new Response('root')
})

r.add('get', '/version', (request, env, ctx) => {
  return new Response('version')
})

r.add('get', '/:cid', [test, cid])

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {ENV} env
 */
function cid(request, env) {
  return new Response(env.name)
}

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {ENV} env
 */
function test(request, env) {
  env.name = 'ssss'
}

r.add(
  'get',
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
  corsHeaders
)

addEventListener('fetch', (event) => {
  event.respondWith(
    r
      .handle(event, { name: 'router' })
      .then((rsp) => {
        return corsHeaders(event.request, rsp)
      })
      .catch((error) => {
        return errorHandler(error, env.log)
      })
  )
})

// Modules syntax
export default {
  fetch: (/** @type {Parameters<ExportedHandlerFetchHandler<ENV>>} */ ...arg) =>
    r.fetch(...arg).catch(errorHandler),
}

const errorHandler = (/** @type {{ message: any; status: any; }} */ error) =>
  new Response(error.message || 'Server Error', { status: error.status || 500 })
```

## CORS
