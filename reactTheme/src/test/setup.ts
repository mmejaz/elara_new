import '@testing-library/jest-dom/vitest'
// Initialize i18next (bundled English/French resources) so components rendered in
// tests resolve t() to real strings instead of raw keys. Defaults to English.
import '../i18n'

// AntD relies on these browser APIs that jsdom doesn't implement.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
