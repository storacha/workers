/* eslint-disable no-console */
import { nanoid } from 'nanoid/non-secure'

/**
 * @typedef {object} User
 * @property {number} id
 *
 * @typedef {object} MetadataRequest
 * @property {string} url
 * @property {string} method
 * @property {any} cf
 * @property {Record<string, string>} headers
 * @property {Response} [response]
 *
 * @typedef {object} CloudflareWorker
 * @property {string} version
 * @property {string} commit
 * @property {string} branch
 * @property {string} worker_id
 * @property {number} worker_started
 *
 * @typedef {object} MetadataResponse
 * @property {Record<string, string>} headers
 * @property {number} status_code
 * @property {number} duration
 *
 * @typedef {object} Metadata
 * @property {User} [user]
 * @property {MetadataRequest} request
 * @property {CloudflareWorker} cloudflare_worker
 * @property {MetadataResponse} [response]
 *
 * @typedef {object} Log
 * @property {string} message
 * @property {string} dt
 * @property {string} level
 * @property {Metadata} metadata
 *
 * @typedef {(log: Log) => object} LogDataTransformerCallback
 */

export class Logging {
  /**
   * @param {Request} request
   * @param {ExecutionContext} context
   * @param {object} opts
   * @param {string} opts.url
   * @param {string} [opts.token]
   * @param {boolean} [opts.debug]
   * @param {string} opts.version
   * @param {string} opts.commit
   * @param {string} opts.branch
   * @param {string} opts.worker
   * @param {string} opts.env
   * @param {import('toucan-js').Toucan} [opts.sentry]
   * @param {LogDataTransformerCallback} [opts.logDataTransformer] - Callback to filter or transform log fields
   */
  constructor(request, context, opts) {
    this.request = request
    this.context = context
    this.opts = opts
    this.logDataTransformer = opts.logDataTransformer

    this._times = new Map()
    /**
     * @type {string[]}
     */
    this._timesOrder = []

    /**
     * @type {Log[]}
     */
    this.logEventsBatch = []
    this.startTs = Date.now()
    this.currentTs = this.startTs

    // Get metadata
    const cf = request.cf
    let rCf
    if (cf) {
      // @ts-ignore
      const { tlsClientAuth, tlsExportedAuthenticator, ...rest } = cf
      rCf = rest
    }

    /**
     * @type {Metadata}
     */
    this.metadata = {
      request: {
        url: request.url,
        method: request.method,
        headers: buildMetadataFromHeaders(request.headers),
        cf: rCf,
      },
      cloudflare_worker: {
        version: this.opts.version,
        commit: this.opts.commit,
        branch: this.opts.branch,
        worker_id: nanoid(10),
        worker_started: this.startTs,
      },
    }
  }

  /**
   * Set user
   *
   * @param {User} user
   **/
  setUser(user) {
    this.metadata = {
      ...this.metadata,
      user,
    }
    if (this.opts.sentry) {
      this.opts.sentry.setUser({
        id: `${user.id}`,
      })
    }
  }

  async postBatch() {
    if (this.logEventsBatch.length > 0) {
      const batchInFlight = [...this.logEventsBatch]
      this.logEventsBatch = []
      const rHost = batchInFlight[0].metadata.request.headers.host
      const lokiBody = {
        streams: [
          {
            stream: {
              worker: this.opts.worker,
              env: this.opts.env,
            },
            values: batchInFlight.map((batch) => [
              String(new Date(batch.dt).getTime() * 1_000_000), // converted to nanoseconds
              JSON.stringify(batch),
            ]),
          },
        ],
      }

      const resp = await fetch(`${this.opts.url}/loki/api/v1/push`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.opts?.token}`,
          'Content-Type': 'application/json',
          'User-Agent': `Cloudflare Worker via ${rHost}`,
        },
        body: JSON.stringify(lokiBody),
      })

      if (this.opts?.debug) {
        console.info(
          `[${this._date()}]`,
          `${batchInFlight.length} Logs pushed with status ${resp.status}.`
        )
      }
    }
  }

  /**
   * End instance, push logs and servers timings
   *
   * @param {Response} response
   */
  async end(response) {
    if (this.opts?.debug) {
      response.headers.set('Server-Timing', this._timersString())
    }
    const run = async () => {
      const dt = this._date()
      const duration = Date.now() - this.startTs
      /**
       * @type {Log}
       */
      const log = {
        message: '',
        dt,
        level: 'info',
        metadata: {
          ...this.metadata,
          response: {
            // @ts-ignore Record<string, string> headers instead of Headers
            headers: buildMetadataFromHeaders(response.headers),
            status_code: response.status,
            duration,
          },
        },
      }
      this._add(log)
      await this.postBatch()
    }
    if (this.opts.token) {
      this.context.waitUntil(run())
    }

    return response
  }

  /**
   * Log
   *
   * @param {string | Error} message
   * @param {'debug' | 'info' | 'warn' | 'error'} level
   * @param {any} [context]
   * @param {any} [metadata]
   */
  log(message, level, context = '', metadata) {
    const dt = this._date()
    let log = {
      dt,
      level,
      metadata: { ...this.metadata, ...metadata },
      ...context,
    }

    if (message instanceof Error) {
      log = {
        ...log,
        stack: message.stack,
        message: message.message,
      }
      if (this.opts.sentry) {
        this.opts.sentry.captureException(message)
      }
      if (this.opts?.debug) {
        console[level](`[${dt}] `, message.stack, context)
      }
    } else {
      log = {
        ...log,
        message,
      }
      if (this.opts?.debug) {
        console[level](`[${dt}] `, message, context)
      }
    }

    this._add(log)
  }

  /**
   * Add log entry to batch after applying logDataTransformer
   *
   * @param {any} body
   */
  _add(body) {
    const log = this.logDataTransformer ? this.logDataTransformer(body) : body
    this.logEventsBatch.push(log)
  }

  /**
   * @param {string} message
   * @param {any} [context]
   */
  debug(message, context) {
    return this.log(message, 'debug', context)
  }

  /**
   * @param {string} message
   * @param {any} [context]
   */
  info(message, context) {
    return this.log(message, 'info', context)
  }

  /**
   * @param {string} message
   * @param {any} [context]
   */
  warn(message, context) {
    return this.log(message, 'warn', context)
  }

  /**
   * @param {string | Error} message
   * @param {any} [context]
   */
  error(message, context) {
    return this.log(message, 'error', context)
  }

  /**
   * @param {string} name
   * @param {any} [description]
   */
  time(name, description) {
    this._times.set(name, {
      name,
      description,
      start: Date.now(),
    })
    this._timesOrder.push(name)
  }

  /**
   * @param {string} name
   */
  timeEnd(name) {
    const timeObj = this._times.get(name)
    if (!timeObj) {
      return console.warn(`No such name ${name}`)
    }

    const end = Date.now()
    const duration = end - timeObj.start
    const value = duration
    timeObj.value = value
    this._times.set(name, {
      ...timeObj,
      end,
      duration,
    })

    if (this.opts?.debug) {
      console.log(`[${this._date()}]`, `${name}: ${duration} ms`)
    }
    return timeObj
  }

  _date() {
    const now = Date.now()
    if (now === this.currentTs) {
      const dt = new Date().toISOString()
      /**
       * Fake increment the datetime string to order the logs entries
       * It won't leap seconds but for most cases it will increment by 1 the datetime milliseconds
       */
      const newDt = dt.replace(/\.(\d*)Z/, (s, p1, p2) => {
        return `.${String(Number(p1) + this.logEventsBatch.length)}Z`
      })
      return new Date(newDt).toISOString()
    } else {
      this.currentTs = now
      return new Date().toISOString()
    }
  }

  _timersString() {
    const result = []
    for (const key of this._timesOrder) {
      const { name, duration, description } = this._times.get(key)
      result.push(
        description
          ? `${name};desc="${description}";dur=${duration}`
          : `${name};dur=${duration}`
      )
    }

    return result.join(',')
  }
}

const buildMetadataFromHeaders = (/** @type {Headers} */ headers) => {
  /** @type {Record<string, string>} */
  const responseMetadata = {}
  for (const [key, value] of headers) {
    responseMetadata[key.replace(/-/g, '_')] = value
  }
  return responseMetadata
}
