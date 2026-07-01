import { describe, expect, it } from 'vitest'
import { serverMessage } from './formErrors'

describe('serverMessage', () => {
  it('returns the server message when present', () => {
    const error = { response: { data: { message: 'Boom' } } }
    expect(serverMessage(error)).toBe('Boom')
  })

  it('falls back when no message', () => {
    expect(serverMessage({}, 'fallback')).toBe('fallback')
  })
})
