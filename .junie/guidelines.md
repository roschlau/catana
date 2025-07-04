# Project Guidelines

## Testing
* Vitest is used as the testing framework and test runner. It's API-compatible with Jest for the most part.
* Tests should be executed by running `npm run test`. Tests are fast, avoid trying to run individual tests.
* Unit tests should be located as close as possible to the tested code. Tests for a function that's located in `src/test/something.ts` should be put in `src/test/something.spec.ts`.
* If tests are failing although the implementation seems correct, inspect the tests for potential issues. If a test doesn't seem correct **do not fix or ignore it**, instead stop what you're doing and ask to for manual verification of the validity of that test.
