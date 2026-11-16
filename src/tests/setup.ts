import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; components only use it for motion / pointer preferences.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
if (typeof window !== 'undefined') window.scrollTo = (() => {}) as typeof window.scrollTo;
