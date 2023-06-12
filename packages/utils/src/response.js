export class JSONResponse extends Response {
  /**
   * @param {unknown} body
   * @param {ResponseInit} [init]
   */
  constructor(body, init = {}) {
    init.headers = new Headers(init.headers)
    init.headers.set('content-type', 'application/json;charset=UTF-8')
    super(JSON.stringify(body), init)
  }

  /**
   * @param {unknown} body
   * @param {ResponseInit} [init]
   */
  static respond(body, init = {}) {
    return new JSONResponse(body, init)
  }
}

/**
 *
 * @param {Request} req
 */
export function notFound(req) {
  return new JSONResponse(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route for ${req.url} was not found.`,
      },
    },
    { status: 404 }
  )
}
