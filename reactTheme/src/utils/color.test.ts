import { describe, expect, it } from 'vitest'
import { hexToRgba, parseHexColor } from './color'

describe('color utils', () => {
  it('parses a hex color into rgb channels', () => {
    expect(parseHexColor('#ff8800')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('builds an rgba string with alpha', () => {
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)')
  })
})
