import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import { afterEach, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

/**
 * Every test file shares one jsdom (`pool: 'forks'`, `singleFork: true`), and
 * every Provider mounts a VoteAnimation that listens on `window`. A file that
 * renders without unmounting leaves those listeners behind to answer launch
 * events fired by the files that run after it, duplicating their flights — so
 * the failure lands somewhere other than the file that caused it.
 */
afterEach(cleanup)

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}
}

expect.extend(matchers)
