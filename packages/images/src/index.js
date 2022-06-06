import { HTTPError } from './errors.js'
import { parseOptions, parseURL, processImageURL } from './utils.js'

/**
 * @param {Request} request
 */
async function handleRequest(request) {
  try {
    const { url, opts } = parseURL(request.url)
    const options = parseOptions(request, opts)
    const imageURL = processImageURL(request, url)

    // Return early for localhost
    if (imageURL.hostname === 'localhost') {
      return Response.redirect(imageURL.toString(), 307)
    }

    // Make a image request with pass-through headers
    const imageRequest = new Request(imageURL.toString(), {
      headers: request.headers,
    })
    const response = await fetch(imageRequest, {
      cf: { image: options },
    })
    return response.ok || response.redirected
      ? response
      : Response.redirect(imageURL.toString(), 307)
  } catch (error) {
    const err = /** @type {Error} */ (error)
    return HTTPError.respond(err)
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})
