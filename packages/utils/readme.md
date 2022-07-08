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

CORS handling for workers.

### Usage

```js
import { Router } from '@web3-storage/worker-utils/router'
import { corsHeaders, preflight } from '@web3-storage/worker-utils/cors'

/**
 * @typedef {{name: string}} ENV
 */

/** @type {Router<ENV>} */
const r = new Router()

r.add('get', '/', () => {
  return new Response('root')
})

// Preflight
r.add('options', '*', preflight)

r.add(
  'get',
  '/cors/route',
  (request, env, ctx) => {
    return new Response('cors')
  },
  // add CORS header to just this route
  corsHeaders
)

addEventListener('fetch', (event) => {
  event.respondWith(
    r.handle(event, { name: 'router' }).then((rsp) => {
      // CORS headers to all the responses to all routes
      return corsHeaders(event.request, rsp)
    })
  )
})

// Modules syntax
export default {
  fetch: (/** @type {Parameters<ExportedHandlerFetchHandler<ENV>>} */ ...arg) =>
    r.fetch(...arg).then((rsp) => {
      // CORS headers to all the responses to all routes
      return corsHeaders(event.request, rsp)
    }),
}
```

## Error

Error handler and HTTPError class with support for `cause`, `status` and `code`.

### Usage

```js
import { Router } from '@web3-storage/worker-utils/router'
import { errorHandler, HTTPError } from '@web3-storage/worker-utils/error'

const r = new Router()

r.add('get', '/', () => {
  return HTTPError.respond(
    new HTTPError('oops', { status: 400, cause: new Error('cause') })
  )
})

addEventListener('fetch', (event) => {
  event.respondWith(r.handle(event, { name: 'router' }).catch(errorHandler))
})

// Modules syntax
export default {
  fetch: (...arg) => r.fetch(...arg).catch(errorHandler),
}
```

## Logging

Worker logging for debugging, sentry error, Server Timing and Logtail.

### Usage

```js
import { Router } from '@web3-storage/worker-utils/router'
import { Logging } from '@web3-storage/worker-utils/logging'

const r = new Router()

r.add('get', '/', () => {
  return HTTPError.respond(
    new HTTPError('oops', { status: 400, cause: new Error('cause') })
  )
})

addEventListener('fetch', (event) => {
  const log = new Logging(
    event.request,
    {
      passThroughOnException: event.passThroughOnException.bind(event),
      waitUntil: event.waitUntil.bind(event),
    },
    {
      debug: config.DEBUG,
      sentry: ['test', 'dev'].includes(config.ENV) ? undefined : sentry,
      branch: config.BRANCH,
      version: config.VERSION,
      commit: config.COMMITHASH,
    }
  )

  // Time the full request
  log.time('request')
  event.respondWith(
    r
      .handle(event, { log })
      .then((rsp) => {
        env.log.timeEnd('request')
        return rsp
      })
      .catch((error) => {
        // errorHandler has support for a log.error function
        return errorHandler(error, env.log)
      })
  )
})

// Modules syntax
export default {
  fetch: (request, env, ctx) => {
    const log = new Logging(event.request, ctx, {
      debug: config.DEBUG,
      sentry: ['test', 'dev'].includes(config.ENV) ? undefined : sentry,
      branch: config.BRANCH,
      version: config.VERSION,
      commit: config.COMMITHASH,
    })

    // Time the full request
    log.time('request')
    return r
      .fetch(request, env, ctx)
      .then((rsp) => {
        env.log.timeEnd('request')
        return rsp
      })
      .catch((error) => {
        // errorHandler has support for a log.error function
        return errorHandler(error, env.log)
      })
  },
}
```

## Response

Json response class and not found function for the Router.

### Usage

```js
import { Router } from '@web3-storage/worker-utils/router'
import { notFound, JSONResponse } from '@web3-storage/worker-utils/response'

const r = new Router({
  onNotFound: notFound,
})

r.add('get', '/', () => new JSONResponse({ value: true }))

addEventListener('fetch', (event) => {
  event.respondWith(r.handle(event))
})

// Modules syntax
export default {
  fetch: (...arg) => r.fetch(...arg),
}
```
