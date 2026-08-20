# Bug: Lint and Type Errors in CI

## Technical Overview
The CI pipeline reported the following errors during the lint and typecheck phases:
1. `ban-ts-comment` error due to the usage of `// @ts-nocheck` without an `eslint-disable` directive in `src/lib/sync.ts`.
2. Missing `../../auth-helper` module in several E2E spec files.
3. Invalid method chaining on Playwright Locators (`page.click('...').first()` instead of `page.locator('...').first().click()`).

## User Story
As a developer, I want the project to pass linting and typechecking locally and in CI so that we can maintain a stable build pipeline without broken tests or code standard violations.

## Acceptance Criteria
- `eslint-disable` is added for the `ban-ts-comment` rule in `src/lib/sync.ts` so that `@ts-nocheck` works without lint failures.
- `auth-helper.ts` is created and exports a valid `login()` function using `test-credentials.ts`.
- `page.click(...).first()` calls are refactored to `page.locator(...).first().click()`.
- `npm run lint` and `npm run typecheck` complete without errors.
