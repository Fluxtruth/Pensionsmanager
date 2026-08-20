# Master Workflow & Guidelines

## 1. Product Management & Task Categorization

Before starting any work, always consider the category of the task (e.g., Feature, Bugfix, Refactoring). 
Instead of using external tools like Linear, all tasks, features, and bugs are managed locally via Markdown files in the `Produktmanagement` directory.

- **Task Creation:** Create a Markdown file in the `Produktmanagement` folder (e.g., `Produktmanagement/Feature_PasswordReset.md` or `Produktmanagement/Bug_LoginError.md`).
- **Content:** The file must contain a technical overview, User Story, and Acceptance Criteria.
- **Workflow:** Keep this file updated as the implementation progresses. Do not start coding before the task is documented.

## 2. Git Workflow & Repository Architecture Guidelines

You must strictly adhere to the following Git workflow, remote-tracking rules, and working directory management instructions when executing, suggesting, or automating version control operations.

### Committer Identity
* **Mandatory Author:** All commits must be made as **"Fluxtruth"** with the email **"philipp.tschakert@gmail.com"** to prevent release issues. Ensure your local or global git config is set correctly (`git config user.name "Fluxtruth"` and `git config user.email "philipp.tschakert@gmail.com"`).

### Branch Architecture & Roles
* **`main` (Production):** Represents production-ready, stable, and tested code. Direct commits to `main` are strictly prohibited. Releases must be merged from `develop` into `main` and tagged with semantic versioning (e.g., `v1.11.6`).
* **`develop` (Integration):** The primary integration branch for ongoing development. All feature branches originate from and merge back into `develop`.
* **`feature/<name>` (Task Isolation):** Isolated branches for specific tasks, bugfixes, or features.
  * Always branch off from the latest local `develop` after pulling the newest remote state (`git checkout develop && git pull origin develop && git checkout -b feature/<name>`).
  * Merge back into `develop` using non-fast-forward merges (`--no-ff`) or via Pull Requests.

### Local vs. Remote Synchronization
* **Explicit Distinction:** 
  * Local branches (`main`, `develop`, `feature/*`) exist only on the local machine within the `.git` directory and represent the active workspace.
  * Remote tracking references (`origin/main`, `origin/develop`) reflect the mirrored state on GitHub/remote servers.
* **Tracking & Setup:**
  * Ensure local branches properly track their upstream remotes (`git checkout --track origin/<branch>` or `git checkout -b main origin/main` if `main` only exists remotely).
  * Always fetch remote changes (`git fetch origin`) before branching, merging, or releasing to verify parity between local references and `origin/*`.
* **Deployment & Release Push:**
  * Fast-forward or merge `develop` into local `main` only during release cycles.
  * Push both branch updates and tags to the remote repository explicitly:
    ```bash
    git push origin main
    git push origin develop
    git push origin --tags
    ```

### Working Directory Hygiene & Worktrees
* **Inspection:** Always verify local repository status using `git status` and `git diff` before staging changes.
* **Stashing:** If a branch switch is required with uncommitted changes in the working directory, use `git stash save "<message>"` instead of creating broken commits. Restore with `git stash pop`.
* **Git Worktrees:** For parallel branch work without context switching or unstashing, use `git worktree add .worktrees/<directory-name> <branch>`.
  * *Codebase Collaboration Rule:* Do not use `git checkout` in the main directory for feature development. Create a dedicated worktree for the task: `git worktree add .worktrees/pm-[TaskName] -b feature/[TaskName] develop`. 
  * All coding, TDD, and testing must be performed inside this newly created directory.
  * *Cleanup:* Physically delete the worktree when done: `git worktree remove .worktrees/pm-[TaskName]`.
* **Artifacts & Secrets:** Never track build artifacts (`node_modules/`, `dist/`, `target/`, `.next/`), local configurations, or environment variables (`.env`, `.env.local`). Verify `.gitignore` compliance before staging.

## 3. Domain-Driven E2E Structure & Testing

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
