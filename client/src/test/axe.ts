import { configureAxe } from 'vitest-axe'

// jsdom cannot compute colors or layout, so contrast is checked separately from computed values.
export const axe = configureAxe({
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: { 'color-contrast': { enabled: false } },
})
