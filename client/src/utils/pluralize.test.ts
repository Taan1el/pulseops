import { describe, it, expect } from 'vitest'
import { pluralize, formatCount } from './pluralize'

describe('pluralize', () => {
  it('uses the singular form for exactly 1', () => {
    expect(pluralize(1, 'incident')).toBe('incident')
    expect(pluralize(-1, 'incident')).toBe('incident')
  })

  it('uses the regular plural form (adds "s") for any other count', () => {
    expect(pluralize(0, 'incident')).toBe('incidents')
    expect(pluralize(2, 'incident')).toBe('incidents')
    expect(pluralize(6, 'service')).toBe('services')
  })

  it('uses an explicit irregular plural when given one', () => {
    expect(pluralize(1, 'entry', 'entries')).toBe('entry')
    expect(pluralize(2, 'entry', 'entries')).toBe('entries')
    expect(pluralize(0, 'entry', 'entries')).toBe('entries')
  })
})

describe('formatCount', () => {
  it('joins the count and the correctly pluralized noun', () => {
    expect(formatCount(1, 'incident')).toBe('1 incident')
    expect(formatCount(2, 'incident')).toBe('2 incidents')
    expect(formatCount(0, 'service')).toBe('0 services')
  })
})
