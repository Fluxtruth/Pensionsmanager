# Domain-Driven E2E Structure & Testing

E2E tests follow a standardized, document-first approach:
- **TDD:** Identify test cases before coding and list them in your implementation plan.
- **Location:** `/tests/e2e/[PageName]/[uc-name]/`
- **Source of Truth (`index.md`):** Contains YAML metadata and a **Mermaid.js** flowchart.
- **Spec (`*.spec.ts`):** A Playwright test where each node in the Mermaid diagram is mapped 1:1 using `test.step()`.
- **Reporting:** Keep `/tests/e2e/summary.md` updated with every new use case.

### E2E Authentication
For all E2E and Smoke tests, use the shared test account:
- **Location:** `tests/e2e/test-credentials.ts`
- **Credentials:** `info@pensionsmanager.de` / `Test1234`
- **Usage:** 
  ```typescript
  import { TEST_ACCOUNT } from '../../test-credentials';
  await page.fill('input[type="email"]', TEST_ACCOUNT.email);
  await page.fill('input[type="password"]', TEST_ACCOUNT.password);
  ```

### Regression & QA
- **Tags:** Use `@smoke` for critical paths and `@regression` for full functional coverage.
- **Visuals:** Use `toHaveScreenshot()` for UI-heavy components (Calendar, Charts).
- **Execution:** Run via `npx playwright test --grep @smoke` (or @regression).
- **Maintenance:** Update the Mermaid diagram *before* modifying test code when UI flows change.
