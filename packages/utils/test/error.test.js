import { errorHandler } from '../src/error.js'
import test from 'ava'

test('should console log ', async (t) => {
  errorHandler(new Error('oops'))
  t.pass()
})
