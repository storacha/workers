import { Router } from 'itty-router'

// now let's create a router (note the lack of "new")
const router = Router()

router.get('/', () => new Response('iitty root'))
router.get('/version', () => new Response('Todos Index!'))

router.get(
  '/:cid',
  () => {},
  () => new Response('double handler')
)
// GET collection index
router.get('/error/route', () => new Response('oops!'))
router.get('/cors/route', () => new Response('coors!'))

// attach the router "handle" to the event handler
addEventListener('fetch', (event) =>
  event.respondWith(router.handle(event.request))
)
