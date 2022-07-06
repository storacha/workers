/**
 * @typedef {(req: ParsedRequest, rsp: Response) => Response} ResponseHandler
 * @typedef {(req: Request) => Response} NotFoundHandler
 * @typedef {'get'|'post'|'put'|'delete'|'options'|'patch'|'connect'|'trace'|'head'} HTTPMethod
 * @typedef {Request & {
 * query: Record<string,string>,
 * params : Record<string,string>,
 * pattern: URLPatternURLPatternResult
 * }} ParsedRequest
 */

/**
 * @template [Env=unknown]
 * @typedef {(request: ParsedRequest, env: Env, ctx: ExecutionContext) => Response | Promise<Response> | void} Handler
 */

/**
 * @template [Env=unknown]
 * @typedef {(request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>} FetchHandler
 */

/**
 * @template C
 * @typedef {[URLPattern, Handler<C>[], ResponseHandler[]]} RouteEntry
 */

/**
 * The Router handles determines which handler is matched given the
 * conditions present for each request.
 *
 * @template C
 */
class Router {
  /**
   * @param {object} [options]
   * @param {NotFoundHandler} [options.onNotFound]
   */
  constructor(options) {
    const defaults = {
      onNotFound() {
        return new Response(undefined, {
          status: 404,
          statusText: 'Not Found',
        })
      },
    }
    this.options = {
      ...defaults,
      ...options,
    }
    /** @type {Record<HTTPMethod,RouteEntry<C>[]>} */
    this.patterns = {
      get: [],
      post: [],
      put: [],
      delete: [],
      options: [],
      trace: [],
      connect: [],
      head: [],
      patch: [],
    }
  }

  /**
   * Add route
   *
   * @param {HTTPMethod} method
   * @param {string | URLPattern} pattern
   * @param {Handler<C>[] | Handler<C>} handlers
   * @param {ResponseHandler[] | ResponseHandler } [postHandlers]
   */
  add(method, pattern, handlers, postHandlers = []) {
    const m = /** @type {HTTPMethod} */ (method.trim().toLowerCase())

    this.patterns[m].push([
      typeof pattern === 'string'
        ? // eslint-disable-next-line no-undef
          new URLPattern({
            pathname: pattern,
          })
        : pattern,
      [handlers].flat(),
      [postHandlers].flat(),
    ])
  }

  /**
   * Resolve returns the matching route for a request that returns
   * true for all conditions (if any).
   *
   * @private
   * @param {Request} req
   * @returns {[URLPatternURLPatternResult, Handler<C>[], ResponseHandler[]] | undefined}
   */
  resolve(req) {
    const method = /** @type {HTTPMethod} */ (req.method.trim().toLowerCase())
    for (let i = 0; i < this.patterns[method].length; i++) {
      const pattern = this.patterns[method][i][0].exec(req.url)
      if (pattern) {
        return [
          pattern,
          this.patterns[method][i][1],
          this.patterns[method][i][2],
        ]
      }
    }
  }

  /**
   * Service Worker syntax handler
   *
   * @param {FetchEvent} event
   * @param {C} env
   */
  handle(event, env) {
    return this.fetch(event.request, env, {
      passThroughOnException: event.passThroughOnException.bind(event),
      waitUntil: event.waitUntil.bind(event),
    })
  }

  /**
   * Module Worker handler
   *
   * @type {FetchHandler<C>}
   */
  async fetch(request, env, context) {
    const parsedRequest = /** @type {ParsedRequest} */ (request)
    const route = this.resolve(request)
    let rsp

    if (route) {
      const [patternResult, handlers, responseHandlers] = route
      const url = new URL(request.url)
      parsedRequest.query = Object.fromEntries(url.searchParams)
      parsedRequest.params = patternResult.pathname.groups
      parsedRequest.pattern = patternResult

      for (const handler of handlers) {
        rsp = await handler(parsedRequest, env, context)
        if (rsp) {
          // eslint-disable-next-line unicorn/no-array-reduce
          return responseHandlers.reduce(
            (r, handler) => handler(parsedRequest, r),
            rsp
          )
        }
      }
      if (rsp === undefined) {
        throw new Error(
          `Route "${request.url}" handlers didn't return a response.`
        )
      }
    } else {
      rsp = this.options.onNotFound(request)
    }

    return rsp
  }
}

export { Router }
