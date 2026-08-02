import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Importing `@testing-library/jest-dom/vitest` registers the matchers *and*
 * their types. Version 7 declares the module augmentation itself, so the hand
 * written `interface Assertion extends jest.Matchers, TestingLibraryMatchers`
 * that used to live here now collides with it — the two spellings of each
 * matcher are not identical and TypeScript refuses both.
 */

/**
 * Every test file shares one jsdom (`pool: 'forks'`, `singleFork: true`), and
 * every Provider mounts a VoteAnimation that listens on `window`. A file that
 * renders without unmounting leaves those listeners behind to answer launch
 * events fired by the files that run after it, duplicating their flights — so
 * the failure lands somewhere other than the file that caused it.
 */
afterEach(cleanup)
