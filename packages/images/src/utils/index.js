import { HTTPError } from '../response.js'
import { validateImageURL } from './validate-url.js'
export * from './validate-url.js'

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
