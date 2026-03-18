---
description: Standard workflow for collaborating on the codebase including Linear integration, TDD, Domain-Driven E2E, Authentication, and Git Worktrees.
---

# Master Workflow: Codebase & E2E Collaboration

Use this workflow for all development tasks, ensuring consistency between features, documentation, and tests.

## 1. Project Lifecycle & Git Worktree
- **Research**, Use linear-mcp-server to understand feature context (list_projects, list_issues).
- **Issues**, Every task must have an associated Linear issue in the **"Pensionsmanager"** team. If missing, create one with tech overview, User Story, and Acceptance Criteria.
- **Worktree Setup**, Do not use `git checkout` in the main directory. Create a dedicated worktree for the task: `git worktree add ../pm-[PEN-ID] -b feature/[PEN-ID]-[description] dev`
- **Execution**, All following steps (coding, TDD, testing) must be performed inside the newly created directory `../pm-[PEN-ID]`.
- **TDD**, Identify test cases before coding and list them in your implementation plan.

## 2. Domain-Driven E2E Structure
E2E tests follow a standardized, document-first approach:
- **Location**, `/tests/e2e/[PageName]/[uc-name]/`
- **Source of Truth (`index.md`)**, Contains YAML metadata and a **Mermaid.js** flowchart.
- **Spec (`*.spec.ts`)**, A Playwright test where each node in the Mermaid diagram is mapped 1:1 using `test.step()`.
- **Reporting**, Keep `/tests/e2e/summary.md` updated with every new use case.

## 3. E2E Authentication
For all E2E and Smoke tests, use the shared test account:
- **Location**, `tests/e2e/test-credentials.ts`
- **Credentials**, `info@pensionsmanager.de` / `Test1234`
- **Usage**, 
  ```typescript
  import { TEST_ACCOUNT } from '../../test-credentials';
  await page.fill('input[type="email"]', TEST_ACCOUNT.email);
  await page.fill('input[type="password"]', TEST_ACCOUNT.password);
  ```

## 4. Regression & QA
- **Tags**, Use `@smoke` for critical paths and `@regression` for full functional coverage.
- **Visuals**, Use `toHaveScreenshot()` for UI-heavy components (Calendar, Charts).
- **Execution**, Run via `npx playwright test --grep @smoke` (or @regression).
- **Maintenance**, Update the Mermaid diagram *before* modifying test code when UI flows change.

## 5. Merging & Release Preparation
Once the feature is approved and the walkthrough is verified:
- **Merging**, Merge the feature branch into the `dev` branch.
- **Cleanup**, Physisch löschen des Worktrees: `git worktree remove ../pm-[PEN-ID]`.
- **Promotion**, When `dev` is stable, follow the [Master Workflow: Release Process](./release-process.md) to promote changes to `main` and create a production release.

---
> [!IMPORTANT]
> This unified workflow emphasizes isolation through Git Worktrees and consistency through Domain-Driven E2E standards.
