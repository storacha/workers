import { test } from './helpers/setup.js'
import { validateImageURL } from '../src/utils/validate-url.js'

test('should pass with allowed domain and path', (t) => {
  const fixture = [
    'http://localhost/foo.png',
    'http://localhost/foo.jpg',
    'http://localhost/foo.jpeg',
    'http://localhost/foo.jpeg',
    'https://web3.storage/foo.jpeg',
    'https://web3-storage-staging.pages.dev/bar.webp',
  ]
  for (const url of fixture) {
    t.truthy(validateImageURL(url))
  }
})

test('should fail if domain or path is UNACCEPTABLE!', (t) => {
  const fixture = ['https://coolgifs.link/foo.png', 'http://localhost/foo.mpeg']
  for (const url of fixture) {
    t.false(validateImageURL(url))
  }
})

test('should validate ipfs subdomain gateway', (t) => {
  t.truthy(validateImageURL('https://foo.ipfs.nftstorage.link/foo.png'))
  t.false(validateImageURL('https://ipfs.nftstorage.link/foo.png'))
})

test('should validate ipns subdomain gateway', (t) => {
  t.truthy(validateImageURL('https://bar.ipns.dweb.link/foo.png'))
  t.false(validateImageURL('https://ipns.nftstorage.link/foo.png'))
})
