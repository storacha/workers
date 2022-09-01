/**
 *
 * @param {Error & { status?: number; code?: string  }} err
 * @param {{ error : (err: Error) => void}} [log]
 */
export function errorHandler(err, log = console) {
  const status = err.status || 500

  const body = {
    error: {
      code: err.code || 'HTTP_ERROR',
      message: err.message || 'Server Error',
      // @ts-ignore
      // eslint-disable-next-line no-nested-ternary
      cause: err.cause
        ? err.cause instanceof Error
          ? err.cause.toString()
          : err.cause
        : undefined,
    },
  }
  if (status >= 500) {
    log.error(err)
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  })
}

export class HTTPError extends Error {
  /**
   *
   * @param {string} [message]
   * @param {ErrorOptions & { status?: number }} [options]
   */
  constructor(message = 'Internal Server Error.', options) {
    super(message, options)
    this.code = 'HTTP_ERROR'
    this.status = options?.status || 500
  }

  /**
   *
   * @param {Error & { status?: number; code?: string }} err
   * @returns
   */
  static respond(err) {
    const body = {
      error: {
        code: err.code || 'HTTP_ERROR',
        message: err.message || 'Internal Server Error.',
        cause: err.cause,
      },
    }
    return new Response(JSON.stringify(body), {
      status: err.status || 500,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    })
  }
}
