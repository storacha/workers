import { HTTPError } from './errors.js'

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

/**
 * Parse the request URL
 *
 * @param {string} url
 */
export function parseURL(url) {
  // eslint-disable-next-line no-undef
  const pattern = new URLPattern({ pathname: '/:opts/*' })
  const exec = pattern.exec(url)

  if (exec && exec.pathname.groups.opts && exec.pathname.groups[0]) {
    return {
      opts: exec.pathname.groups.opts,
      url: exec.pathname.groups[0],
    }
  }
  HTTPError.throw(`Request URL is invalid.`, 400)
}

/**
 * Validate the image URL
 *
 * @param {string} hostname
 */
function validateImageURL(hostname) {
  const hostnames = [
    'localhost',
    'web3.storage',
    'web3-storage.pages.dev',
    'nft.storage',
    'nft-storage-1at.pages.dev',
  ]
  // eslint-disable-next-line no-undef
  const pattern = new URLPattern({
    protocol: 'http{s}?',
    hostname: `{*.}?(${hostnames.join('|')})`,
    pathname: '*.(jpe?g|png|gif|webp)',
  })

  const out = pattern.exec(hostname)
  if (out === null) {
    return false
  }

  return out
}

/**
 * @param {Request} request
 * @param {string} url
 */
export function processImageURL(request, url) {
  const referer = request.headers.get('Referer')

  // Check absolute url
  let validURL = validateImageURL(url)
  if (validURL) {
    return new URL(validURL.inputs[0].toString())
  }

  // Check relative with referer
  validURL = validateImageURL(referer + url)
  if (validURL) {
    return new URL(validURL.inputs[0].toString())
  }

  HTTPError.throw(
    `Image URL is invalid: ${url}. Try either an absolute or a relative with a valid referer URL. Format: https://images.web3.storage/<OPTIONS>/<SOURCE-IMAGE>.`,
    400
  )
}

/**
 * @param {Request} request
 * @param {string} options
 */
export function parseOptions(request, options) {
  const opts = options.split(',')
  /** @type {RequestInitCfPropertiesImage} */
  const config = {}
  let found = false

  for (const opt of opts) {
    if (opt.startsWith('width=')) {
      found = true
      config.width = Number(opt.replace('width=', ''))
    }

    if (opt.startsWith('fit=')) {
      found = true
      const fit = opt.replace('fit=', '')
      switch (fit) {
        case 'scale-down':
        case 'contain':
        case 'cover':
        case 'crop':
        case 'pad':
          config.fit = fit
          break

        default:
          HTTPError.throw('Option "fit" invalid.', 400)
      }
    }

    if (opt.startsWith('height=')) {
      found = true
      config.height = Number(opt.replace('height=', ''))
    }

    if (opt.startsWith('quality=')) {
      found = true
      config.quality = Number(opt.replace('quality=', ''))
    }
  }

  if (!found) {
    HTTPError.throw('Missing options for image.', 400)
  }

  // Image format
  const accept = request.headers.get('Accept')
  if (!accept) {
    HTTPError.throw('Missing "Accept" header', 400)
  }

  if (/image\/avif/.test(accept)) {
    config.format = 'avif'
  } else if (/image\/webp/.test(accept)) {
    config.format = 'webp'
  }

  return config
}
