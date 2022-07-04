/**
 * Validate the image URL
 *
 * @param {string} hostname
 */
export function validateImageURL(hostname) {
  const hostnames = [
    'localhost',
    'web3.storage',
    'web3-storage.pages.dev',
    'web3-storage-staging.pages.dev',
    'nft.storage',
    'nft-storage-1at.pages.dev',
  ]

  const pathname = '*.(jpe?g|png|gif|webp)'

  // eslint-disable-next-line no-undef
  const allowListPattern = new URLPattern({
    protocol: 'http{s}?',
    hostname: `{*.}?(${hostnames.join('|')})`,
    pathname,
  })

  // eslint-disable-next-line no-undef
  const gatewayPattern = new URLPattern({
    protocol: 'http{s}?',
    hostname: '*.ip(fs|ns).*',
    pathname: '*.(jpe?g|png|gif|webp)',
  })

  for (const pattern of [allowListPattern, gatewayPattern]) {
    const out = pattern.exec(hostname)
    if (out !== null) {
      return out
    }
  }
  return false
}
