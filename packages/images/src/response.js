/** @typedef {{ code: string }} Coded */

export class JSONResponse extends Response {
  /**
   *
   * @param {unknown} body
   * @param {ResponseInit} [init]
   */
  constructor(body, init = {}) {
    const headers = {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    }
    super(JSON.stringify(body), { ...init, ...headers })
  }
}

export class HTTPError extends Error {
  /**
   *
   * @param {string} message
   * @param {number} [status]
   */
  constructor(message, status = 500) {
    super(message)
    this.name = 'HTTPError'
    this.status = status
  }

  /**
   * @param {string} message
   * @param {number} [status]
   * @returns {never}
   */
  static throw(message, status) {
    throw new this(message, status)
  }

  /**
   * @param {Error & {status?: number;code?: string;}} err
   */
  static respond(err) {
    const { message, code, status } = maybeCapture(err)
    return new JSONResponse(
      {
        ok: false,
        error: { code, message },
      },
      {
        status,
      }
    )
  }
}

/**
 * Pass me an error and I might send it to sentry if it's important. Either way
 * I'll give you back a HTTPError with a user friendly error message and code.
 *
 * @param {any} err
 * @returns {HTTPError & Coded} A HTTPError with an error code.
 */
export function maybeCapture(err) {
  let code = err.code || 'HTTP_ERROR'
  let message = err.message
  const status = err.status || 500

  switch (err.code) {
    case ErrorImageURLInvalid.CODE:
      break
    default:
      // catch all server errors
      if (status >= 500) {
        code = err.name
        message = err.message
        // eslint-disable-next-line no-console
        console.error(err)
      }
      break
  }

  return Object.assign(new HTTPError(message, status), { code })
}

export class ErrorImageURLInvalid extends HTTPError {
  constructor(msg = 'Image URL is invalid.') {
    super(msg, 400)
    this.name = 'ImageURLInvalid'
    this.code = ErrorImageURLInvalid.CODE
  }
}
ErrorImageURLInvalid.CODE = 'ERROR_IMAGE_INVALID'
